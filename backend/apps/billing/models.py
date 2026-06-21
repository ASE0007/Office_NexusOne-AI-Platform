"""NexusOne AI - Billing Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Invoice(models.Model):
    DRAFT = 'draft'
    PENDING = 'pending'
    PAID = 'paid'
    OVERDUE = 'overdue'
    CANCELLED = 'cancelled'
    REFUNDED = 'refunded'

    STATUS_CHOICES = [
        (DRAFT, 'Draft'), (PENDING, 'Pending'), (PAID, 'Paid'),
        (OVERDUE, 'Overdue'), (CANCELLED, 'Cancelled'), (REFUNDED, 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey('crm.Customer', on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    invoice_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)

    issue_date = models.DateField()
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)

    # Financials
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')

    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurring_interval = models.CharField(max_length=20, blank=True)  # monthly, quarterly, yearly

    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)

    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice #{self.invoice_number}"

    def calculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(item.amount for item in items)
        self.tax_amount = self.subtotal * (self.tax_rate / 100)
        self.total = self.subtotal + self.tax_amount - self.discount
        self.save(update_fields=['subtotal', 'tax_amount', 'total'])


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    amount = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = 'invoice_items'

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Payment(models.Model):
    STRIPE = 'stripe'
    PAYPAL = 'paypal'
    BANK_TRANSFER = 'bank_transfer'
    CASH = 'cash'
    BKASH = 'bkash'
    NAGAD = 'nagad'

    METHOD_CHOICES = [
        (STRIPE, 'Stripe'), (PAYPAL, 'PayPal'), (BANK_TRANSFER, 'Bank Transfer'),
        (CASH, 'Cash'), (BKASH, 'bKash'), (NAGAD, 'Nagad'),
    ]

    SUCCESS = 'success'
    PENDING = 'pending'
    FAILED = 'failed'
    REFUNDED = 'refunded'

    STATUS_CHOICES = [
        (SUCCESS, 'Success'), (PENDING, 'Pending'), (FAILED, 'Failed'), (REFUNDED, 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    customer = models.ForeignKey('crm.Customer', on_delete=models.CASCADE, related_name='payments', null=True, blank=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

    transaction_id = models.CharField(max_length=255, blank=True)
    gateway_response = models.JSONField(default=dict)

    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='expenses')
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    receipt = models.FileField(upload_to='expense_receipts/', blank=True, null=True)
    notes = models.TextField(blank=True)

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    STATUS_CHOICES = [(PENDING, 'Pending'), (APPROVED, 'Approved'), (REJECTED, 'Rejected')]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

    expense_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
