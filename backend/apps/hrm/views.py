"""NexusOne AI - HRM Views"""

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import date, timedelta

from .models import Employee, Attendance, LeaveRequest, SalaryRecord
from .serializers import EmployeeSerializer, AttendanceSerializer, LeaveRequestSerializer, SalaryRecordSerializer


def generate_employee_id(company):
    count = Employee.objects.filter(company=company).count() + 1
    return f"EMP-{str(count).zfill(4)}"


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'employment_type', 'department']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'designation']

    def get_queryset(self):
        return Employee.objects.filter(company=self.request.user.company).select_related('user', 'department', 'manager')

    def perform_create(self, serializer):
        company = self.request.user.company
        extra = {'company': company}
        if not self.request.data.get('employee_id'):
            extra['employee_id'] = generate_employee_id(company)
        if not self.request.data.get('date_of_joining'):
            extra['date_of_joining'] = date.today()
        serializer.save(**extra)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(company=self.request.user.company)


class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'employee', 'date']
    ordering_fields = ['date']

    def get_queryset(self):
        return Attendance.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Calculate work hours
        check_in = self.request.data.get('check_in')
        check_out = self.request.data.get('check_out')
        work_hours = 0
        if check_in and check_out:
            from datetime import datetime
            fmt = '%H:%M'
            t1 = datetime.strptime(check_in, fmt)
            t2 = datetime.strptime(check_out, fmt)
            delta = t2 - t1
            work_hours = round(delta.seconds / 3600, 2)
        serializer.save(company=self.request.user.company, work_hours=work_hours)


class TodayAttendanceView(APIView):
    """Mark today's attendance (check-in/out)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({'error': 'Not an employee'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        action = request.data.get('action')  # 'check_in' or 'check_out'
        now_time = timezone.now().time()

        attendance, created = Attendance.objects.get_or_create(
            employee=employee, date=today,
            defaults={'company': request.user.company, 'status': 'present'}
        )
        if action == 'check_in':
            attendance.check_in = now_time
        elif action == 'check_out':
            attendance.check_out = now_time
            if attendance.check_in:
                from datetime import datetime
                t1 = datetime.combine(today, attendance.check_in)
                t2 = datetime.combine(today, now_time)
                attendance.work_hours = round((t2 - t1).seconds / 3600, 2)
        attendance.save()
        return Response(AttendanceSerializer(attendance).data)


class LeaveRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'leave_type', 'employee']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        return LeaveRequest.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee_profile
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('No employee profile found')
        serializer.save(company=self.request.user.company, employee=employee)


class LeaveApprovalView(APIView):
    """Approve or reject leave"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        leave = get_object_or_404(LeaveRequest, id=pk, company=request.user.company)
        action = request.data.get('action')  # 'approve' or 'reject'
        if action == 'approve':
            leave.status = LeaveRequest.APPROVED
            leave.approved_by = request.user
        elif action == 'reject':
            leave.status = LeaveRequest.REJECTED
            leave.rejection_reason = request.data.get('reason', '')
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)


class SalaryRecordListView(generics.ListCreateAPIView):
    serializer_class = SalaryRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'employee', 'month', 'year']

    def get_queryset(self):
        return SalaryRecord.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        data = self.request.data
        basic = float(data.get('basic_salary', 0))
        allowances = float(data.get('allowances', 0))
        deductions = float(data.get('deductions', 0))
        tax = float(data.get('tax', 0))
        net = basic + allowances - deductions - tax
        serializer.save(company=self.request.user.company, net_salary=net)


class HRMStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        today = date.today()
        stats = {
            'total_employees': Employee.objects.filter(company=company, status='active').count(),
            'on_leave': LeaveRequest.objects.filter(company=company, status='approved', start_date__lte=today, end_date__gte=today).count(),
            'present_today': Attendance.objects.filter(company=company, date=today, status='present').count(),
            'pending_leaves': LeaveRequest.objects.filter(company=company, status='pending').count(),
        }
        return Response(stats)
