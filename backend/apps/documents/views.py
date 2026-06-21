"""NexusOne AI - Documents Views"""

from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count

from .models import DocumentFolder, Document
from .serializers import DocumentFolderSerializer, DocumentSerializer


class DocumentFolderListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentFolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent']

    def get_queryset(self):
        return DocumentFolder.objects.filter(company=self.request.user.company).select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class DocumentFolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentFolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DocumentFolder.objects.filter(company=self.request.user.company)


class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['folder', 'file_type', 'is_public', 'requires_approval']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'file_size']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Document.objects.filter(company=self.request.user.company).select_related('uploaded_by', 'folder')
        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__icontains=tag)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        serializer.save(
            company=self.request.user.company,
            uploaded_by=self.request.user,
            file_size=file.size if file else 0,
            file_type=(file.content_type if file else '') or (file.name.split('.')[-1] if file else ''),
        )


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(company=self.request.user.company)

    def get_serializer_context(self):
        return {'request': self.request}


class DocumentStatsView(APIView):
    """Document storage and breakdown stats."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Document.objects.filter(company=request.user.company)
        total_size = qs.aggregate(total=Sum('file_size'))['total'] or 0
        by_type = qs.values('file_type').annotate(count=Count('id')).order_by('-count')[:10]

        return Response({
            'total_documents': qs.count(),
            'total_folders': DocumentFolder.objects.filter(company=request.user.company).count(),
            'total_storage_bytes': total_size,
            'total_storage_display': self._human_size(total_size),
            'public_documents': qs.filter(is_public=True).count(),
            'pending_approval': qs.filter(requires_approval=True).count(),
            'by_file_type': list(by_type),
        })

    def _human_size(self, size):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
