"""NexusOne AI - HRM Serializers"""

from rest_framework import serializers
from .models import Employee, Attendance, LeaveRequest, SalaryRecord


class EmployeeSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']
        extra_kwargs = {
            # Both are auto-filled in perform_create when left blank
            # (employee_id gets an EMP-#### number, date_of_joining defaults
            # to today) so the admin doesn't have to type them by hand.
            'employee_id': {'required': False, 'allow_blank': True},
            'date_of_joining': {'required': False},
        }

    def get_user_name(self, obj):
        return obj.user.get_full_name()

    def get_user_email(self, obj):
        return obj.user.email

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_manager_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else None


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at', 'work_hours']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        # employee is resolved server-side from request.user.employee_profile
        # in perform_create — a user must never be able to file leave on
        # someone else's behalf by passing a different employee id.
        read_only_fields = ['id', 'company', 'created_at', 'updated_at', 'approved_by', 'employee']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None


class SalaryRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryRecord
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()
