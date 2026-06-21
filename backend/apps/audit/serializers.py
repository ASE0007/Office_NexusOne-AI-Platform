"""NexusOne AI - Audit Serializers"""

from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_email', 'company',
            'action', 'resource_type', 'resource_id', 'description',
            'ip_address', 'user_agent', 'request_method', 'request_path',
            'response_status', 'old_values', 'new_values', 'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'System'

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
