"""NexusOne AI - CRM Serializers"""

from rest_framework import serializers
from .models import Customer, CustomerNote, CustomerDocument, Lead, CustomerActivity


class CustomerNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomerNote
        fields = '__all__'
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None


class CustomerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerDocument
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class CustomerActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomerActivity
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else None


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    assigned_to_name = serializers.SerializerMethodField()
    recent_notes = CustomerNoteSerializer(many=True, read_only=True, source='customer_notes')

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at', 'total_revenue', 'outstanding_balance']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at', 'converted_customer']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
