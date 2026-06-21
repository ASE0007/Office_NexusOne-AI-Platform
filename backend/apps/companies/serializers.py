"""NexusOne AI - Companies Serializers"""

from rest_framework import serializers
from .models import Company, Department


class CompanySerializer(serializers.ModelSerializer):
    user_count = serializers.ReadOnlyField()
    storage_usage_percent = serializers.ReadOnlyField()

    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'used_storage_gb']


class CompanyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'name', 'email', 'phone', 'website', 'logo',
            'address', 'city', 'country', 'timezone', 'currency',
            'language', 'settings', 'theme_color'
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at']

    def get_head_name(self, obj):
        return obj.head.get_full_name() if obj.head else None

    def get_member_count(self, obj):
        return obj.company.users.filter(is_active=True).count()
