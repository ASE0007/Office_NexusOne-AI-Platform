"""NexusOne AI - Audit Views"""

from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """List audit logs with filtering, search, and ordering."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'user', 'response_status', 'request_method']
    search_fields = ['description', 'request_path', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'response_status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.all() if user.role == 'super_admin' else AuditLog.objects.filter(company=user.company)

        # Date range filter
        days = self.request.query_params.get('days')
        if days:
            try:
                cutoff = timezone.now() - timedelta(days=int(days))
                qs = qs.filter(created_at__gte=cutoff)
            except (ValueError, TypeError):
                pass

        return qs.select_related('user', 'company')


class AuditLogStatsView(APIView):
    """Summary stats for the audit dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = AuditLog.objects.all() if user.role == 'super_admin' else AuditLog.objects.filter(company=user.company)

        last_24h = timezone.now() - timedelta(hours=24)
        last_7d = timezone.now() - timedelta(days=7)

        by_method = qs.values('request_method').annotate(count=Count('id')).order_by('-count')
        by_resource = qs.values('resource_type').annotate(count=Count('id')).order_by('-count')[:10]
        by_status = qs.exclude(response_status__isnull=True).values('response_status').annotate(count=Count('id'))

        return Response({
            'total_logs': qs.count(),
            'last_24h': qs.filter(created_at__gte=last_24h).count(),
            'last_7d': qs.filter(created_at__gte=last_7d).count(),
            'errors_count': qs.filter(response_status__gte=400).count(),
            'by_method': list(by_method),
            'by_resource_type': list(by_resource),
            'by_status_code': list(by_status),
            'unique_users': qs.exclude(user__isnull=True).values('user').distinct().count(),
        })


class AuditLogExportView(APIView):
    """Export audit logs as CSV."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = AuditLog.objects.all() if user.role == 'super_admin' else AuditLog.objects.filter(company=user.company)
        qs = qs.select_related('user').order_by('-created_at')[:5000]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        writer = csv.writer(response)
        writer.writerow(['Date', 'User', 'Method', 'Path', 'Resource Type', 'Status', 'IP Address'])
        for log in qs:
            writer.writerow([
                log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                log.user.email if log.user else 'System',
                log.request_method,
                log.request_path,
                log.resource_type,
                log.response_status,
                log.ip_address,
            ])
        return response
