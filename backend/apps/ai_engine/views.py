"""NexusOne AI - AI Engine Views"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import AIService


class AICopilotView(APIView):
    """Main AI Copilot - answer business questions"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({'error': 'Question is required'}, status=status.HTTP_400_BAD_REQUEST)

        company = request.user.company
        # Build context from company data
        from apps.crm.models import Customer
        from apps.projects.models import Project
        from apps.billing.models import Invoice
        from apps.support.models import Ticket
        from apps.tasks.models import Task

        context = {
            'company': company.name if company else 'Unknown',
            'total_customers': Customer.objects.filter(company=company).count(),
            'active_projects': Project.objects.filter(company=company, status='active').count(),
            'open_tickets': Ticket.objects.filter(company=company, status='open').count(),
            'pending_invoices': Invoice.objects.filter(company=company, status='pending').count(),
            'overdue_tasks': sum(1 for t in Task.objects.filter(company=company, status__in=['pending', 'in_progress']) if t.is_overdue),
        }

        ai = AIService()
        answer = ai.answer_business_question(question, context)
        return Response({'question': question, 'answer': answer, 'context': context})


class AIBusinessInsightsView(APIView):
    """Generate AI business insights"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from django.db.models import Sum
        from apps.billing.models import Invoice, Payment
        from apps.crm.models import Customer
        from apps.projects.models import Project

        data = {
            'total_revenue': float(Invoice.objects.filter(company=company, status='paid').aggregate(Sum('total'))['total__sum'] or 0),
            'total_customers': Customer.objects.filter(company=company).count(),
            'active_projects': Project.objects.filter(company=company, status='active').count(),
            'customer_growth': Customer.objects.filter(company=company).count(),
        }
        ai = AIService()
        insights = ai.generate_business_insights(data)
        return Response({'insights': insights, 'data': data})


class AIRevenueAnalysisView(APIView):
    """AI revenue analysis"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.billing.models import Invoice
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta

        # Last 6 months
        monthly_data = []
        for i in range(6):
            month_start = (timezone.now() - timedelta(days=30 * i)).replace(day=1)
            revenue = Invoice.objects.filter(
                company=company, status='paid',
                created_at__year=month_start.year,
                created_at__month=month_start.month
            ).aggregate(Sum('total'))['total__sum'] or 0
            monthly_data.append({'month': month_start.strftime('%b %Y'), 'revenue': float(revenue)})

        ai = AIService()
        analysis = ai.analyze_revenue({'monthly_revenue': monthly_data})
        return Response({'analysis': analysis, 'monthly_data': monthly_data})


class AIProjectRiskView(APIView):
    """Detect at-risk projects"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.projects.models import Project
        projects = Project.objects.filter(company=company, status='active')
        projects_data = [
            {
                'title': p.title,
                'progress': p.progress,
                'deadline': str(p.deadline),
                'is_overdue': p.is_overdue,
                'budget_usage': p.budget_usage_percent,
            }
            for p in projects
        ]
        ai = AIService()
        analysis = ai.detect_delayed_projects(projects_data)
        return Response({'analysis': analysis, 'projects': projects_data})


class AITaskPrioritizationView(APIView):
    """AI task prioritization"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.tasks.models import Task
        tasks = Task.objects.filter(
            company=request.user.company,
            assigned_to=request.user,
            status__in=['pending', 'in_progress']
        )[:20]
        tasks_data = [
            {'title': t.title, 'priority': t.priority, 'due_date': str(t.due_date), 'is_overdue': t.is_overdue}
            for t in tasks
        ]
        ai = AIService()
        prioritization = ai.smart_task_prioritization(tasks_data)
        return Response({'prioritization': prioritization, 'tasks': tasks_data})
