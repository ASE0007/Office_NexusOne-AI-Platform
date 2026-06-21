"""NexusOne AI - Documents Serializers"""

from rest_framework import serializers
from .models import DocumentFolder, Document


class DocumentFolderSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()
    subfolder_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentFolder
        fields = [
            'id', 'name', 'parent', 'company', 'created_by', 'created_by_name',
            'document_count', 'subfolder_count', 'created_at',
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at']

    def get_document_count(self, obj):
        return obj.documents.count()

    def get_subfolder_count(self, obj):
        return obj.subfolders.count()

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    folder_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file', 'file_url', 'file_type',
            'file_size', 'file_size_display', 'version', 'tags', 'is_public',
            'requires_approval', 'folder', 'folder_name', 'company',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'company', 'uploaded_by', 'file_type', 'file_size', 'created_at', 'updated_at']

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None

    def get_folder_name(self, obj):
        return obj.folder.name if obj.folder else None

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def get_file_size_display(self, obj):
        size = obj.file_size or 0
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
