"""NexusOne AI - Projects Serializers"""

from rest_framework import serializers
from .models import Project, Milestone, ProjectFile


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    team_members = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    budget_usage_percent = serializers.ReadOnlyField()
    task_count = serializers.SerializerMethodField()
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at', 'spent']

    def get_manager_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else None

    def get_client_name(self, obj):
        return obj.client.full_name if obj.client else None

    def get_team_members(self, obj):
        return [{'id': str(u.id), 'name': u.get_full_name(), 'avatar': u.avatar.url if u.avatar else None}
                for u in obj.team.all()]

    def get_task_count(self, obj):
        return obj.tasks.count()
