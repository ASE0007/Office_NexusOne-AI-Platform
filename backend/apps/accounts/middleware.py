"""NexusOne AI - Tenant Middleware"""

from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """
    Attaches company context to each request for multi-tenant isolation.
    """

    def process_request(self, request):
        request.company = None
        if request.user.is_authenticated and hasattr(request.user, 'company'):
            request.company = request.user.company
