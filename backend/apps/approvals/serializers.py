"""NexusOne AI - Approvals Serializers"""

from rest_framework import serializers
from .models import ApprovalRequest


class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'request_type', 'title', 'description', 'status',
            'resource_id', 'data', 'rejection_reason',
            'requested_by', 'requested_by_name',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'company', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'company', 'requested_by', 'reviewed_by', 'reviewed_at', 'status', 'created_at', 'updated_at']

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() if obj.requested_by else None

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else None
