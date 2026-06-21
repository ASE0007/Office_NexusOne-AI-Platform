"""NexusOne AI - Companies Models (Multi-Tenant)"""

import uuid
from django.db import models
from django.conf import settings


class Company(models.Model):
    FREE = 'free'
    STARTER = 'starter'
    PROFESSIONAL = 'professional'
    ENTERPRISE = 'enterprise'

    PLAN_CHOICES = [
        (FREE, 'Free'),
        (STARTER, 'Starter'),
        (PROFESSIONAL, 'Professional'),
        (ENTERPRISE, 'Enterprise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    currency = models.CharField(max_length=10, default='USD')
    language = models.CharField(max_length=10, default='en')

    # Subscription
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=FREE)
    plan_expires_at = models.DateTimeField(null=True, blank=True)
    max_users = models.IntegerField(default=5)
    max_storage_gb = models.FloatField(default=1.0)
    used_storage_gb = models.FloatField(default=0.0)

    # Settings
    settings = models.JSONField(default=dict)
    theme_color = models.CharField(max_length=7, default='#6366f1')
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'companies'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def user_count(self):
        return self.users.filter(is_active=True).count()

    @property
    def storage_usage_percent(self):
        if self.max_storage_gb == 0:
            return 0
        return round((self.used_storage_gb / self.max_storage_gb) * 100, 1)


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments'
    )
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_departments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'
        unique_together = ['company', 'name']

    def __str__(self):
        return f"{self.company.name} - {self.name}"
