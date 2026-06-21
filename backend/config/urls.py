"""NexusOne AI - URL Configuration"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/', include([
        # Auth
        path('auth/', include('apps.accounts.urls')),

        # Companies / Tenants
        path('companies/', include('apps.companies.urls')),

        # CRM
        path('crm/', include('apps.crm.urls')),

        # Projects
        path('projects/', include('apps.projects.urls')),

        # Tasks
        path('tasks/', include('apps.tasks.urls')),

        # Billing & Finance
        path('billing/', include('apps.billing.urls')),

        # Support Tickets
        path('support/', include('apps.support.urls')),

        # HRM
        path('hrm/', include('apps.hrm.urls')),

        # Inventory
        path('inventory/', include('apps.inventory.urls')),

        # Analytics
        path('analytics/', include('apps.analytics.urls')),

        # AI Engine
        path('ai/', include('apps.ai_engine.urls')),

        # Notifications
        path('notifications/', include('apps.notifications.urls')),

        # Documents
        path('documents/', include('apps.documents.urls')),

        # Approvals
        path('approvals/', include('apps.approvals.urls')),

        # Audit Logs
        path('audit/', include('apps.audit.urls')),

        # Calendar
        path('calendar/', include('apps.calendar_app.urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
