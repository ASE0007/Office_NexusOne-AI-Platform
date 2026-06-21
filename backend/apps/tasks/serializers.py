"""NexusOne AI - Tasks Serializers"""

from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment, TimeLog


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None


class TaskAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAttachment
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class TimeLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = TimeLog
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else None


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    checklist_progress = serializers.ReadOnlyField()
    subtask_count = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at', 'actual_hours']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_subtask_count(self, obj):
        return obj.subtasks.count()
