"""NexusOne AI - Projects Views"""

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Project, Milestone, ProjectFile
from .serializers import ProjectSerializer, MilestoneSerializer, ProjectFileSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'manager', 'client']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority']

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.filter(company=user.company)
        if user.role in ['employee', 'support_agent']:
            qs = qs.filter(team=user)
        return qs.prefetch_related('team', 'milestones')

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(company=self.request.user.company)

    def perform_destroy(self, instance):
        instance.status = 'archived'
        instance.save()


class ProjectMilestonesView(generics.ListCreateAPIView):
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.filter(project__company=self.request.user.company, project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'], company=self.request.user.company)
        serializer.save(project=project)


class KanbanBoardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, company=request.user.company)
        from apps.tasks.models import Task
        from apps.tasks.serializers import TaskSerializer

        board = {}
        for status_key, status_label in Task.STATUS_CHOICES:
            tasks = Task.objects.filter(project=project, status=status_key, parent=None)
            board[status_key] = {
                'label': status_label,
                'tasks': TaskSerializer(tasks, many=True).data,
                'count': tasks.count(),
            }
        return Response(board)


class ProjectStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        from apps.tasks.models import Task
        stats = {
            'total': Project.objects.filter(company=company).count(),
            'active': Project.objects.filter(company=company, status='active').count(),
            'completed': Project.objects.filter(company=company, status='completed').count(),
            'on_hold': Project.objects.filter(company=company, status='on_hold').count(),
            'overdue': sum(1 for p in Project.objects.filter(company=company, status='active') if p.is_overdue),
        }
        return Response(stats)
