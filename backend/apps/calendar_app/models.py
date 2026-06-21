"""NexusOne AI - Calendar Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CalendarEvent(models.Model):
    MEETING = 'meeting'
    DEADLINE = 'deadline'
    REMINDER = 'reminder'
    HOLIDAY = 'holiday'
    TASK = 'task'
    OTHER = 'other'

    EVENT_TYPE_CHOICES = [
        (MEETING, 'Meeting'),
        (DEADLINE, 'Deadline'),
        (REMINDER, 'Reminder'),
        (HOLIDAY, 'Holiday'),
        (TASK, 'Task'),
        (OTHER, 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'companies.Company', on_delete=models.CASCADE,
        related_name='calendar_events', null=True, blank=True
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_events'
    )
    attendees = models.ManyToManyField(
        User, related_name='events', blank=True
    )

    # Link to other modules
    project = models.ForeignKey(
        'projects.Project', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='events'
    )
    customer = models.ForeignKey(
        'crm.Customer', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='events'
    )
    task = models.ForeignKey(
        'tasks.Task', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='events'
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default=MEETING)

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)

    location = models.CharField(max_length=255, blank=True)
    meeting_link = models.URLField(blank=True)

    color = models.CharField(max_length=20, blank=True)
    reminder_minutes = models.IntegerField(null=True, blank=True)

    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'

    def __str__(self):
        return f"{self.title} ({self.start_datetime.date()})"

    @property
    def project_title(self):
        return self.project.title if self.project else None

    @property
    def customer_name(self):
        return self.customer.full_name if self.customer else None
