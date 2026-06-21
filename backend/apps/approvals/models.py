"""NexusOne AI - Approvals Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ApprovalRequest(models.Model):
    LEAVE = 'leave'
    EXPENSE = 'expense'
    INVOICE = 'invoice'
    PURCHASE = 'purchase'
    DOCUMENT = 'document'
    TASK = 'task'

    TYPE_CHOICES = [
        (LEAVE, 'Leave'), (EXPENSE, 'Expense'), (INVOICE, 'Invoice'),
        (PURCHASE, 'Purchase'), (DOCUMENT, 'Document'), (TASK, 'Task'),
    ]

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (PENDING, 'Pending'), (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'), (CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='approval_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approval_requests')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_approvals')

    request_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

    resource_id = models.CharField(max_length=255, blank=True)  # ID of the related object
    data = models.JSONField(default=dict)  # Snapshot of request data

    rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'approval_requests'
        ordering = ['-created_at']
