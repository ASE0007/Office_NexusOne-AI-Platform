"""NexusOne AI - Companies Views"""

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Company, Department
from .serializers import CompanySerializer, CompanyUpdateSerializer, DepartmentSerializer


class CompanyDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CompanyUpdateSerializer
        return CompanySerializer

    def get_object(self):
        return get_object_or_404(Company, id=self.request.user.company_id)


class CompanyCreateView(generics.CreateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        company = serializer.save()
        self.request.user.company = company
        self.request.user.role = 'company_admin'
        self.request.user.save()


class DepartmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Department.objects.filter(company=self.request.user.company, is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Department.objects.filter(company=self.request.user.company)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class CompanyStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        if not company:
            return Response({'error': 'No company associated'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.crm.models import Customer
        from apps.projects.models import Project
        from apps.billing.models import Invoice
        from apps.support.models import Ticket

        stats = {
            'total_users': company.user_count,
            'total_customers': Customer.objects.filter(company=company).count(),
            'active_projects': Project.objects.filter(company=company, status='active').count(),
            'open_tickets': Ticket.objects.filter(company=company, status='open').count(),
            'pending_invoices': Invoice.objects.filter(company=company, status='pending').count(),
            'plan': company.plan,
            'storage_usage': company.storage_usage_percent,
        }
        return Response(stats)
