"""NexusOne AI - Audit Middleware"""

import logging
logger = logging.getLogger(__name__)

EXCLUDED_PATHS = ['/api/v1/auth/token/refresh/', '/api/v1/notifications/']


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log API write operations
        if (request.path.startswith('/api/') and
                request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and
                request.path not in EXCLUDED_PATHS):
            try:
                from apps.audit.models import AuditLog
                user = request.user if request.user.is_authenticated else None
                company = getattr(user, 'company', None) if user else None

                AuditLog.objects.create(
                    user=user,
                    company=company,
                    action=request.method,
                    resource_type=request.path.split('/')[3] if len(request.path.split('/')) > 3 else '',
                    request_method=request.method,
                    request_path=request.path,
                    response_status=response.status_code,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                )
            except Exception as e:
                logger.error(f"Audit log error: {e}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
