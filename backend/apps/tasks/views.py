"""NexusOne AI - Tasks Views"""

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Task, TaskComment, TaskAttachment, TimeLog
from .serializers import TaskSerializer, TaskCommentSerializer, TimeLogSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'project']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'order']

    def get_queryset(self):
        return Task.objects.filter(company=self.request.user.company, parent=None)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(company=self.request.user.company)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_status = self.request.data.get('status')
        if new_status == Task.COMPLETED and instance.status != Task.COMPLETED:
            serializer.save(completed_at=timezone.now())
        else:
            serializer.save()


class TaskCommentsView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TaskComment.objects.filter(task__company=self.request.user.company, task_id=self.kwargs['task_id'])

    def perform_create(self, serializer):
        task = get_object_or_404(Task, id=self.kwargs['task_id'], company=self.request.user.company)
        serializer.save(task=task, author=self.request.user)


class TimeLogView(generics.ListCreateAPIView):
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TimeLog.objects.filter(task__company=self.request.user.company, task_id=self.kwargs['task_id'])

    def perform_create(self, serializer):
        task = get_object_or_404(Task, id=self.kwargs['task_id'], company=self.request.user.company)
        log = serializer.save(task=task, user=self.request.user)
        # Update task actual hours
        total = sum(t.hours for t in task.time_logs.all())
        task.actual_hours = total
        task.save(update_fields=['actual_hours'])


class UpdateTaskOrderView(APIView):
    """Drag and drop reordering for Kanban"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tasks = request.data.get('tasks', [])
        for item in tasks:
            Task.objects.filter(id=item['id'], company=request.user.company).update(
                status=item.get('status'), order=item.get('order', 0)
            )
        return Response({'message': 'Order updated'})


class TaskStatsView(APIView):
    """Dashboard stat cards: counts by status plus overdue count.
    Computed server-side so the frontend doesn't need to fetch every
    task just to show a count."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Task.objects.filter(company=request.user.company)
        now = timezone.now()

        return Response({
            'total': qs.count(),
            'pending': qs.filter(status=Task.PENDING).count(),
            'in_progress': qs.filter(status=Task.IN_PROGRESS).count(),
            'review': qs.filter(status=Task.REVIEW).count(),
            'completed': qs.filter(status=Task.COMPLETED).count(),
            'blocked': qs.filter(status=Task.BLOCKED).count(),
            'overdue': qs.filter(
                due_date__lt=now
            ).exclude(status=Task.COMPLETED).count(),
            'assigned_to_me': qs.filter(assigned_to=request.user).count(),
        })
