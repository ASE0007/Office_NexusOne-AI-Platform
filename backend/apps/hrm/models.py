"""NexusOne AI - HRM Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Employee(models.Model):
    FULL_TIME = 'full_time'
    PART_TIME = 'part_time'
    CONTRACT = 'contract'
    INTERN = 'intern'

    TYPE_CHOICES = [
        (FULL_TIME, 'Full Time'), (PART_TIME, 'Part Time'),
        (CONTRACT, 'Contract'), (INTERN, 'Intern'),
    ]

    ACTIVE = 'active'
    INACTIVE = 'inactive'
    TERMINATED = 'terminated'
    ON_LEAVE = 'on_leave'

    STATUS_CHOICES = [
        (ACTIVE, 'Active'), (INACTIVE, 'Inactive'),
        (TERMINATED, 'Terminated'), (ON_LEAVE, 'On Leave'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='employees')
    department = models.ForeignKey('companies.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_reports')

    employee_id = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=FULL_TIME)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)

    date_of_joining = models.DateField()
    date_of_birth = models.DateField(null=True, blank=True)
    date_of_termination = models.DateField(null=True, blank=True)

    # Salary
    basic_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')

    # Personal
    gender = models.CharField(max_length=20, blank=True)
    marital_status = models.CharField(max_length=20, blank=True)
    national_id = models.CharField(max_length=50, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Skills & Performance
    skills = models.JSONField(default=list)
    performance_rating = models.FloatField(null=True, blank=True)

    # Leave balances
    annual_leave_balance = models.IntegerField(default=21)
    sick_leave_balance = models.IntegerField(default=14)

    documents = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'
        ordering = ['user__first_name']

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"


class Attendance(models.Model):
    PRESENT = 'present'
    ABSENT = 'absent'
    HALF_DAY = 'half_day'
    REMOTE = 'remote'
    ON_LEAVE = 'on_leave'
    HOLIDAY = 'holiday'

    STATUS_CHOICES = [
        (PRESENT, 'Present'), (ABSENT, 'Absent'), (HALF_DAY, 'Half Day'),
        (REMOTE, 'Remote'), (ON_LEAVE, 'On Leave'), (HOLIDAY, 'Holiday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='attendance')

    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PRESENT)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    work_hours = models.FloatField(default=0)
    overtime_hours = models.FloatField(default=0)
    location = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = ['employee', 'date']
        ordering = ['-date']


class LeaveRequest(models.Model):
    ANNUAL = 'annual'
    SICK = 'sick'
    UNPAID = 'unpaid'
    MATERNITY = 'maternity'
    PATERNITY = 'paternity'
    EMERGENCY = 'emergency'

    TYPE_CHOICES = [
        (ANNUAL, 'Annual'), (SICK, 'Sick'), (UNPAID, 'Unpaid'),
        (MATERNITY, 'Maternity'), (PATERNITY, 'Paternity'), (EMERGENCY, 'Emergency'),
    ]

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (PENDING, 'Pending'), (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'), (CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='leave_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')

    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.IntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leave_requests'
        ordering = ['-created_at']


class SalaryRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_records')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='salary_records')

    month = models.IntegerField()
    year = models.IntegerField()
    basic_salary = models.DecimalField(max_digits=15, decimal_places=2)
    allowances = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')

    PENDING = 'pending'
    PAID = 'paid'
    STATUS_CHOICES = [(PENDING, 'Pending'), (PAID, 'Paid')]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)

    notes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'salary_records'
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']
