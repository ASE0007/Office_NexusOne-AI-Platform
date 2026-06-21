"""NexusOne AI - Analytics Views"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta, date


class DashboardAnalyticsView(APIView):
    """Master dashboard analytics"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        today = date.today()
        month_start = timezone.make_aware(timezone.datetime.combine(today.replace(day=1), timezone.datetime.min.time()))
        last_month_start = timezone.make_aware(timezone.datetime.combine((today.replace(day=1) - timedelta(days=1)).replace(day=1), timezone.datetime.min.time()))

        from apps.crm.models import Customer
        from apps.projects.models import Project
        from apps.billing.models import Invoice, Payment
        from apps.support.models import Ticket
        from apps.tasks.models import Task
        from apps.hrm.models import Employee, Attendance

        # Revenue this month vs last month
        this_month_rev = float(Payment.objects.filter(
            company=company, status='success',
            created_at__gte=month_start
        ).aggregate(Sum('amount'))['amount__sum'] or 0)

        last_month_rev = float(Payment.objects.filter(
            company=company, status='success',
            created_at__gte=last_month_start,
            created_at__lt=month_start
        ).aggregate(Sum('amount'))['amount__sum'] or 0)

        rev_growth = 0
        if last_month_rev > 0:
            rev_growth = round(((this_month_rev - last_month_rev) / last_month_rev) * 100, 1)

        # Monthly revenue for chart (last 12 months)
        monthly_revenue = []
        for i in range(11, -1, -1):
            m_date = (today.replace(day=1) - timedelta(days=30 * i))
            m_rev = float(Payment.objects.filter(
                company=company, status='success',
                created_at__year=m_date.year,
                created_at__month=m_date.month
            ).aggregate(Sum('amount'))['amount__sum'] or 0)
            monthly_revenue.append({'month': m_date.strftime('%b %Y'), 'revenue': m_rev})

        # Customer growth (last 6 months)
        customer_growth = []
        for i in range(5, -1, -1):
            m_date = (today.replace(day=1) - timedelta(days=30 * i))
            count = Customer.objects.filter(
                company=company,
                created_at__year=m_date.year,
                created_at__month=m_date.month
            ).count()
            customer_growth.append({'month': m_date.strftime('%b'), 'count': count})

        # Ticket status distribution
        ticket_distribution = list(
            Ticket.objects.filter(company=company)
            .values('status')
            .annotate(count=Count('id'))
            .order_by()
        )

        # Project status distribution
        project_distribution = list(
            Project.objects.filter(company=company)
            .values('status')
            .annotate(count=Count('id'))
            .order_by()
        )

        # Today's attendance
        present_today = Attendance.objects.filter(company=company, date=today, status='present').count()
        total_employees = Employee.objects.filter(company=company, status='active').count()

        return Response({
            'summary': {
                'total_customers': Customer.objects.filter(company=company).count(),
                'new_customers_this_month': Customer.objects.filter(company=company, created_at__gte=month_start).count(),
                'active_projects': Project.objects.filter(company=company, status='active').count(),
                'open_tickets': Ticket.objects.filter(company=company, status='open').count(),
                'pending_invoices': Invoice.objects.filter(company=company, status='pending').count(),
                'overdue_invoices': Invoice.objects.filter(company=company, status='overdue').count(),
                'this_month_revenue': this_month_rev,
                'last_month_revenue': last_month_rev,
                'revenue_growth_percent': rev_growth,
                'present_today': present_today,
                'total_employees': total_employees,
                'attendance_rate': round((present_today / total_employees * 100) if total_employees else 0, 1),
                'pending_tasks': Task.objects.filter(company=company, status='pending').count(),
                'overdue_tasks': sum(1 for t in Task.objects.filter(company=company, status__in=['pending', 'in_progress']) if t.is_overdue),
            },
            'charts': {
                'monthly_revenue': monthly_revenue,
                'customer_growth': customer_growth,
                'ticket_distribution': ticket_distribution,
                'project_distribution': project_distribution,
            }
        })


class RevenueReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.billing.models import Invoice, Payment, Expense
        from django.db.models import Sum

        period = request.query_params.get('period', 'month')
        today = date.today()

        if period == 'month':
            start = today.replace(day=1)
        elif period == 'quarter':
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start = today.replace(month=quarter_month, day=1)
        elif period == 'year':
            start = today.replace(month=1, day=1)
        else:
            start = today.replace(day=1)

        revenue = float(Payment.objects.filter(
            company=company, status='success',
            created_at__gte=timezone.make_aware(timezone.datetime.combine(start, timezone.datetime.min.time()))
        ).aggregate(Sum('amount'))['amount__sum'] or 0)
        expenses = float(Expense.objects.filter(company=company, status='approved', expense_date__gte=start).aggregate(Sum('amount'))['amount__sum'] or 0)
        profit = revenue - expenses

        return Response({
            'period': period,
            'revenue': revenue,
            'expenses': expenses,
            'profit': profit,
            'profit_margin': round((profit / revenue * 100) if revenue > 0 else 0, 1),
        })


class CustomerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.crm.models import Customer, Lead

        by_status = list(Customer.objects.filter(company=company).values('status').annotate(count=Count('id')))
        by_source = list(Customer.objects.filter(company=company).values('source').annotate(count=Count('id')))
        top_customers = list(Customer.objects.filter(company=company).order_by('-total_revenue')[:10].values('first_name', 'last_name', 'total_revenue', 'company_name'))

        lead_conversion = {
            'total_leads': Lead.objects.filter(company=company).count(),
            'converted': Lead.objects.filter(company=company, status='converted').count(),
        }

        return Response({'by_status': by_status, 'by_source': by_source, 'top_customers': top_customers, 'lead_conversion': lead_conversion})


class EmployeeAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.hrm.models import Employee, Attendance, LeaveRequest
        today = date.today()

        attendance_this_month = list(
            Attendance.objects.filter(company=company, date__gte=today.replace(day=1))
            .values('status').annotate(count=Count('id'))
        )
        by_department = list(
            Employee.objects.filter(company=company, status='active')
            .values('department__name').annotate(count=Count('id'))
        )
        leave_types = list(
            LeaveRequest.objects.filter(company=company, status='approved')
            .values('leave_type').annotate(count=Count('id'))
        )

        return Response({'attendance_this_month': attendance_this_month, 'by_department': by_department, 'leave_types': leave_types})
