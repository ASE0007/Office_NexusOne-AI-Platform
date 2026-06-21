"""NexusOne AI - Approvals Views"""

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import ApprovalRequest
from .serializers import ApprovalRequestSerializer


class ApprovalListCreateView(generics.ListCreateAPIView):
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['request_type', 'status']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = ApprovalRequest.objects.filter(company=user.company).select_related('requested_by', 'reviewed_by')
        # Managers/admins see all company requests; employees see only their own + ones pending their review
        if user.role in ['super_admin', 'company_admin', 'manager']:
            return qs
        return qs.filter(requested_by=user)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, requested_by=self.request.user)


class ApprovalDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ApprovalRequest.objects.filter(company=self.request.user.company)


class ApprovalActionView(APIView):
    """Approve or reject a pending approval request."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            approval = ApprovalRequest.objects.get(pk=pk, company=request.user.company)
        except ApprovalRequest.DoesNotExist:
            return Response({'detail': 'Approval request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if approval.status != ApprovalRequest.PENDING:
            return Response({'detail': f'This request was already {approval.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        if action not in ['approve', 'reject']:
            return Response({'detail': "Action must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            approval.status = ApprovalRequest.APPROVED
        else:
            approval.status = ApprovalRequest.REJECTED
            approval.rejection_reason = request.data.get('reason', '')

        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save()

        # Notify the requester
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=approval.requested_by,
                title=f"Request {approval.status}",
                message=f"Your {approval.get_request_type_display()} request '{approval.title}' was {approval.status}.",
                notification_type='approval',
            )
        except Exception:
            pass

        serializer = ApprovalRequestSerializer(approval)
        return Response(serializer.data)


class PendingApprovalsView(generics.ListAPIView):
    """Quick view for items awaiting the current user's review."""
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in ['super_admin', 'company_admin', 'manager']:
            return ApprovalRequest.objects.none()
        return ApprovalRequest.objects.filter(
            company=user.company, status=ApprovalRequest.PENDING
        ).select_related('requested_by')
