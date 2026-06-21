from django.urls import path
from . import views

urlpatterns = [
    path('logs/', views.AuditLogListView.as_view(), name='audit-logs'),
    path('logs/stats/', views.AuditLogStatsView.as_view(), name='audit-stats'),
    path('logs/export/', views.AuditLogExportView.as_view(), name='audit-export'),
]
