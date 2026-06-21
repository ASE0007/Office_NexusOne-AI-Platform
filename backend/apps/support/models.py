"""NexusOne AI - Support Ticket Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TicketCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='ticket_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6366f1')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ticket_categories'


class Ticket(models.Model):
    OPEN = 'open'
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    RESOLVED = 'resolved'
    CLOSED = 'closed'
    ESCALATED = 'escalated'

    STATUS_CHOICES = [
        (OPEN, 'Open'), (PENDING, 'Pending'), (IN_PROGRESS, 'In Progress'),
        (RESOLVED, 'Resolved'), (CLOSED, 'Closed'), (ESCALATED, 'Escalated'),
    ]

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

    PRIORITY_CHOICES = [
        (LOW, 'Low'), (MEDIUM, 'Medium'), (HIGH, 'High'), (CRITICAL, 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='tickets')
    customer = models.ForeignKey('crm.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    category = models.ForeignKey(TicketCategory, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tickets')

    ticket_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=OPEN)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=MEDIUM)

    # SLA
    sla_due_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    tags = models.JSONField(default=list)
    ai_summary = models.TextField(blank=True)
    ai_suggested_reply = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.ticket_number} - {self.title}"

    @property
    def is_sla_breached(self):
        from django.utils import timezone
        if self.sla_due_at and self.status not in [self.RESOLVED, self.CLOSED]:
            return timezone.now() > self.sla_due_at
        return False


class TicketReply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal notes not visible to customer
    is_ai_generated = models.BooleanField(default=False)
    attachments = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ticket_replies'
        ordering = ['created_at']


class TicketAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='ticket_attachments/')
    name = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_attachments'
