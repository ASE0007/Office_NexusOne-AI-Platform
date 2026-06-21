"""NexusOne AI - Projects Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Project(models.Model):
    PLANNING = 'planning'
    ACTIVE = 'active'
    ON_HOLD = 'on_hold'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (PLANNING, 'Planning'), (ACTIVE, 'Active'), (ON_HOLD, 'On Hold'),
        (COMPLETED, 'Completed'), (CANCELLED, 'Cancelled'), (ARCHIVED, 'Archived'),
    ]

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

    PRIORITY_CHOICES = [
        (LOW, 'Low'), (MEDIUM, 'Medium'), (HIGH, 'High'), (CRITICAL, 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='projects')
    client = models.ForeignKey('crm.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    team = models.ManyToManyField(User, blank=True, related_name='team_projects')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PLANNING)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=MEDIUM)

    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    progress = models.IntegerField(default=0)  # 0-100
    tags = models.JSONField(default=list)
    custom_fields = models.JSONField(default=dict)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.deadline and self.status not in [self.COMPLETED, self.CANCELLED]:
            return self.deadline < timezone.now().date()
        return False

    @property
    def budget_usage_percent(self):
        if not self.budget or self.budget == 0:
            return 0
        return round((float(self.spent) / float(self.budget)) * 100, 1)


class Milestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'milestones'
        ordering = ['due_date']


class ProjectFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='project_files/')
    file_size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_files'
