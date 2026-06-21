"""NexusOne AI - Billing Views"""

import uuid as uuid_module
from datetime import date
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count
from django.http import HttpResponse

from .models import Invoice, InvoiceItem, Payment, Expense
from .serializers import InvoiceSerializer, InvoiceItemSerializer, PaymentSerializer, ExpenseSerializer


def generate_invoice_number(company):
    count = Invoice.objects.filter(company=company).count() + 1
    return f"INV-{date.today().year}-{str(count).zfill(5)}"


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'currency']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'due_date', 'total']

    def get_queryset(self):
        return Invoice.objects.filter(company=self.request.user.company).prefetch_related('items', 'payments')

    def perform_create(self, serializer):
        company = self.request.user.company
        serializer.save(
            company=company,
            created_by=self.request.user,
            invoice_number=generate_invoice_number(company),
            issue_date=date.today(),
        )


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(company=self.request.user.company)


class InvoiceItemsView(generics.ListCreateAPIView):
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__company=self.request.user.company, invoice_id=self.kwargs['invoice_id'])

    def perform_create(self, serializer):
        invoice = get_object_or_404(Invoice, id=self.kwargs['invoice_id'], company=self.request.user.company)
        serializer.save(invoice=invoice)
        invoice.calculate_totals()


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'method', 'customer']
    ordering_fields = ['created_at', 'amount']

    def get_queryset(self):
        return Payment.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        invoice_id = self.request.data.get('invoice')
        invoice = None
        if invoice_id:
            invoice = get_object_or_404(Invoice, id=invoice_id, company=self.request.user.company)

        payment = serializer.save(
            company=self.request.user.company,
            customer=invoice.customer if invoice else None,
            paid_at=timezone.now(),
        )
        if invoice and payment.status == 'success':
            invoice.status = Invoice.PAID
            invoice.paid_at = timezone.now()
            invoice.save()


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'project']
    search_fields = ['title', 'category']

    def get_queryset(self):
        return Expense.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, submitted_by=self.request.user)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(company=self.request.user.company)


class BillingStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        invoices = Invoice.objects.filter(company=company)
        payments = Payment.objects.filter(company=company, status='success')

        stats = {
            'total_invoiced': float(invoices.aggregate(Sum('total'))['total__sum'] or 0),
            'total_collected': float(payments.aggregate(Sum('amount'))['amount__sum'] or 0),
            'pending_amount': float(invoices.filter(status='pending').aggregate(Sum('total'))['total__sum'] or 0),
            'overdue_amount': float(invoices.filter(status='overdue').aggregate(Sum('total'))['total__sum'] or 0),
            'total_invoices': invoices.count(),
            'paid_invoices': invoices.filter(status='paid').count(),
            'pending_invoices': invoices.filter(status='pending').count(),
            'overdue_invoices': invoices.filter(status='overdue').count(),
        }
        return Response(stats)


class GenerateInvoicePDFView(APIView):
    """Generate PDF invoice"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice, id=pk, company=request.user.company)
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        import io

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(f"INVOICE #{invoice.invoice_number}", styles['Title']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Date: {invoice.issue_date}", styles['Normal']))
        elements.append(Paragraph(f"Due: {invoice.due_date}", styles['Normal']))
        elements.append(Paragraph(f"Customer: {invoice.customer.full_name if invoice.customer else 'N/A'}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [['Description', 'Qty', 'Unit Price', 'Amount']]
        for item in invoice.items.all():
            data.append([item.description, str(item.quantity), f"${item.unit_price}", f"${item.amount}"])
        data.append(['', '', 'Subtotal', f"${invoice.subtotal}"])
        data.append(['', '', f'Tax ({invoice.tax_rate}%)', f"${invoice.tax_amount}"])
        data.append(['', '', 'TOTAL', f"${invoice.total}"])

        table = Table(data, colWidths=[250, 60, 100, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice-{invoice.invoice_number}.pdf"'
        return response
