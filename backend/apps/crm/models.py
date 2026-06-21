"""NexusOne AI - CRM Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Customer(models.Model):
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    PROSPECT = 'prospect'
    VIP = 'vip'

    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (INACTIVE, 'Inactive'),
        (PROSPECT, 'Prospect'),
        (VIP, 'VIP'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='customers')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_customers')

    # Basic Info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to='customer_avatars/', blank=True, null=True)

    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)

    # Status & Tags
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PROSPECT)
    tags = models.JSONField(default=list)
    source = models.CharField(max_length=100, blank=True)  # How they found you

    # Notes & Custom Fields
    notes = models.TextField(blank=True)
    custom_fields = models.JSONField(default=dict)

    # Financials
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class CustomerNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='customer_notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_notes'
        ordering = ['-created_at']


class CustomerDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='customer_documents/')
    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_documents'


class Lead(models.Model):
    NEW = 'new'
    CONTACTED = 'contacted'
    QUALIFIED = 'qualified'
    PROPOSAL = 'proposal'
    NEGOTIATION = 'negotiation'
    CONVERTED = 'converted'
    LOST = 'lost'

    STATUS_CHOICES = [
        (NEW, 'New'),
        (CONTACTED, 'Contacted'),
        (QUALIFIED, 'Qualified'),
        (PROPOSAL, 'Proposal Sent'),
        (NEGOTIATION, 'Negotiation'),
        (CONVERTED, 'Converted'),
        (LOST, 'Lost'),
    ]

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'

    PRIORITY_CHOICES = [(LOW, 'Low'), (MEDIUM, 'Medium'), (HIGH, 'High')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='leads')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NEW)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=MEDIUM)
    source = models.CharField(max_length=100, blank=True)
    expected_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    expected_close_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    follow_up_date = models.DateTimeField(null=True, blank=True)

    converted_customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='lead'
    )

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_leads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.status}"

    def convert_to_customer(self):
        """Convert lead to customer"""
        customer = Customer.objects.create(
            company=self.company,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            phone=self.phone,
            company_name=self.company_name,
            source=self.source,
            assigned_to=self.assigned_to,
            created_by=self.created_by,
        )
        self.status = self.CONVERTED
        self.converted_customer = customer
        self.save()
        return customer


class CustomerActivity(models.Model):
    CALL = 'call'
    EMAIL = 'email'
    MEETING = 'meeting'
    NOTE = 'note'
    TASK = 'task'

    TYPE_CHOICES = [
        (CALL, 'Call'), (EMAIL, 'Email'), (MEETING, 'Meeting'),
        (NOTE, 'Note'), (TASK, 'Task'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    activity_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_activities'
        ordering = ['-created_at']
