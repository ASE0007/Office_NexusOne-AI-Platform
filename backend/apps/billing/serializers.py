"""NexusOne AI - Billing Serializers"""

from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment, Expense


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['id', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    payments_received = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'
        # invoice_number and issue_date are set automatically by the view
        # (see generate_invoice_number / perform_create in views.py) — they
        # must NOT be required input or every invoice creation 400s.
        # customer is optional: the frontend explicitly supports "No Customer"
        # invoices, so it can't be required here either.
        read_only_fields = [
            'id', 'company', 'created_by', 'created_at', 'updated_at',
            'subtotal', 'tax_amount', 'total', 'invoice_number', 'issue_date',
        ]
        extra_kwargs = {
            'customer': {'required': False, 'allow_null': True},
        }

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else None

    def get_payments_received(self, obj):
        return float(sum(p.amount for p in obj.payments.filter(status='success')))


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'company', 'customer', 'created_at', 'gateway_response']
        extra_kwargs = {
            'invoice': {'required': False, 'allow_null': True},
        }


class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'company', 'submitted_by', 'created_at']

    def get_submitted_by_name(self, obj):
        return obj.submitted_by.get_full_name() if obj.submitted_by else None
