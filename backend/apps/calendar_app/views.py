"""NexusOne AI - Calendar Views"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime
import calendar

from .models import CalendarEvent
from .serializers import CalendarEventSerializer


class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CalendarEvent.objects.filter(
            Q(created_by=user) | Q(attendees=user)
        ).distinct()

        # Filter by month/year
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            try:
                month = int(month)
                year = int(year)
                _, last_day = calendar.monthrange(year, month)
                start = datetime(year, month, 1)
                end = datetime(year, month, last_day, 23, 59, 59)
                qs = qs.filter(
                    Q(start_datetime__lte=end) & Q(end_datetime__gte=start)
                )
            except (ValueError, TypeError):
                pass

        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(start_datetime__date__gte=start_date)
        if end_date:
            qs = qs.filter(end_datetime__date__lte=end_date)

        return qs.select_related('created_by', 'project', 'customer', 'task').prefetch_related('attendees')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        events = self.get_queryset().filter(
            Q(start_datetime__date=today) | Q(is_all_day=True, start_datetime__date__lte=today, end_datetime__date__gte=today)
        )
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        from django.utils import timezone
        now = timezone.now()
        limit = int(request.query_params.get('limit', 10))
        events = self.get_queryset().filter(start_datetime__gte=now)[:limit]
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
