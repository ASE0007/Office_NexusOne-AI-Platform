"""NexusOne AI - Support Serializers"""

from rest_framework import serializers
from .models import Ticket, TicketReply, TicketCategory, TicketAttachment


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = '__all__'
        read_only_fields = ['id', 'company']


class TicketReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()

    class Meta:
        model = TicketReply
        fields = '__all__'
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else 'System'

    def get_author_role(self, obj):
        return obj.author.role if obj.author else None


class TicketSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    is_sla_breached = serializers.ReadOnlyField()
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['id', 'company', 'ticket_number', 'created_by', 'created_at', 'updated_at', 'ai_summary', 'ai_suggested_reply']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_reply_count(self, obj):
        return obj.replies.count()
