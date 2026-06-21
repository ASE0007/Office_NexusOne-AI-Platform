"""NexusOne AI - Tasks Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Task(models.Model):
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    REVIEW = 'review'
    COMPLETED = 'completed'
    BLOCKED = 'blocked'

    STATUS_CHOICES = [
        (PENDING, 'Pending'), (IN_PROGRESS, 'In Progress'),
        (REVIEW, 'Review'), (COMPLETED, 'Completed'), (BLOCKED, 'Blocked'),
    ]

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

    PRIORITY_CHOICES = [
        (LOW, 'Low'), (MEDIUM, 'Medium'), (HIGH, 'High'), (CRITICAL, 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=MEDIUM)

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks')

    due_date = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.FloatField(null=True, blank=True)
    actual_hours = models.FloatField(default=0)

    checklist = models.JSONField(default=list)  # [{title, done}, ...]
    tags = models.JSONField(default=list)
    order = models.IntegerField(default=0)

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.due_date and self.status not in [self.COMPLETED]:
            return self.due_date < timezone.now()
        return False

    @property
    def checklist_progress(self):
        if not self.checklist:
            return 0
        done = sum(1 for item in self.checklist if item.get('done', False))
        return round((done / len(self.checklist)) * 100)


class TaskComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']


class TaskAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='task_attachments/')
    name = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_attachments'


class TimeLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    hours = models.FloatField()
    description = models.TextField(blank=True)
    logged_at = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'time_logs'
        ordering = ['-logged_at']
