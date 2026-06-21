"""NexusOne AI - CRM Views"""

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Customer, CustomerNote, CustomerDocument, Lead, CustomerActivity
from .serializers import (
    CustomerSerializer, CustomerNoteSerializer, CustomerDocumentSerializer,
    LeadSerializer, CustomerActivitySerializer
)


class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_to', 'country']
    search_fields = ['first_name', 'last_name', 'email', 'company_name', 'phone']
    ordering_fields = ['created_at', 'first_name', 'total_revenue']

    def get_queryset(self):
        return Customer.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Customer.objects.filter(company=self.request.user.company)

    def perform_destroy(self, instance):
        instance.delete()


class CustomerNotesView(generics.ListCreateAPIView):
    serializer_class = CustomerNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomerNote.objects.filter(customer__company=self.request.user.company, customer_id=self.kwargs['customer_id'])

    def perform_create(self, serializer):
        customer = get_object_or_404(Customer, id=self.kwargs['customer_id'], company=self.request.user.company)
        serializer.save(customer=customer, author=self.request.user)


class CustomerDocumentsView(generics.ListCreateAPIView):
    serializer_class = CustomerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomerDocument.objects.filter(customer__company=self.request.user.company, customer_id=self.kwargs['customer_id'])

    def perform_create(self, serializer):
        customer = get_object_or_404(Customer, id=self.kwargs['customer_id'], company=self.request.user.company)
        file = self.request.FILES.get('file')
        serializer.save(customer=customer, uploaded_by=self.request.user,
                        file_size=file.size if file else 0,
                        file_type=file.content_type if file else '')


class CustomerActivitiesView(generics.ListCreateAPIView):
    serializer_class = CustomerActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomerActivity.objects.filter(customer__company=self.request.user.company, customer_id=self.kwargs['customer_id'])

    def perform_create(self, serializer):
        customer = get_object_or_404(Customer, id=self.kwargs['customer_id'], company=self.request.user.company)
        serializer.save(customer=customer, user=self.request.user)


class LeadListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'email', 'company_name']
    ordering_fields = ['created_at', 'expected_close_date', 'expected_value']

    def get_queryset(self):
        return Lead.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class LeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Lead.objects.filter(company=self.request.user.company)


class ConvertLeadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lead = get_object_or_404(Lead, id=pk, company=request.user.company)
        if lead.status == Lead.CONVERTED:
            return Response({'error': 'Lead already converted'}, status=status.HTTP_400_BAD_REQUEST)
        customer = lead.convert_to_customer()
        return Response({'message': 'Lead converted successfully', 'customer_id': str(customer.id)})


class CRMStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        stats = {
            'total_customers': Customer.objects.filter(company=company).count(),
            'active_customers': Customer.objects.filter(company=company, status='active').count(),
            'vip_customers': Customer.objects.filter(company=company, status='vip').count(),
            'total_leads': Lead.objects.filter(company=company).count(),
            'new_leads': Lead.objects.filter(company=company, status='new').count(),
            'converted_leads': Lead.objects.filter(company=company, status='converted').count(),
        }
        return Response(stats)
