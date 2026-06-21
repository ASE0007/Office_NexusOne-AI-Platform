"""NexusOne AI - Support Views"""

from datetime import date
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Ticket, TicketReply, TicketCategory
from .serializers import TicketSerializer, TicketReplySerializer, TicketCategorySerializer


def generate_ticket_number(company):
    count = Ticket.objects.filter(company=company).count() + 1
    return f"TKT-{date.today().year}-{str(count).zfill(6)}"


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'category', 'customer']
    search_fields = ['ticket_number', 'title', 'description']
    ordering_fields = ['created_at', 'priority', 'sla_due_at']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.filter(company=user.company).prefetch_related('replies')
        if user.role == 'support_agent':
            qs = qs.filter(assigned_to=user)
        return qs

    def perform_create(self, serializer):
        company = self.request.user.company
        # Set SLA based on priority
        sla_hours = {'low': 72, 'medium': 24, 'high': 8, 'critical': 2}
        priority = self.request.data.get('priority', 'medium')
        sla_due = timezone.now() + timezone.timedelta(hours=sla_hours.get(priority, 24))

        serializer.save(
            company=company,
            created_by=self.request.user,
            ticket_number=generate_ticket_number(company),
            sla_due_at=sla_due,
        )


class TicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(company=self.request.user.company)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_status = self.request.data.get('status')
        if new_status == Ticket.RESOLVED and instance.status != Ticket.RESOLVED:
            serializer.save(resolved_at=timezone.now())
        else:
            serializer.save()


class TicketRepliesView(generics.ListCreateAPIView):
    serializer_class = TicketReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = TicketReply.objects.filter(ticket__company=user.company, ticket_id=self.kwargs['ticket_id'])
        if user.role == 'customer':
            qs = qs.filter(is_internal=False)
        return qs

    def perform_create(self, serializer):
        ticket = get_object_or_404(Ticket, id=self.kwargs['ticket_id'], company=self.request.user.company)
        reply = serializer.save(ticket=ticket, author=self.request.user)
        # Mark first response
        if not ticket.first_response_at:
            ticket.first_response_at = timezone.now()
            ticket.status = Ticket.IN_PROGRESS
            ticket.save()


class AITicketSummaryView(APIView):
    """Generate AI summary and suggested reply for ticket"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        ticket = get_object_or_404(Ticket, id=pk, company=request.user.company)
        from apps.ai_engine.services import AIService
        ai = AIService()
        summary = ai.summarize_ticket(ticket)
        suggested_reply = ai.suggest_ticket_reply(ticket)
        ticket.ai_summary = summary
        ticket.ai_suggested_reply = suggested_reply
        ticket.save()
        return Response({'summary': summary, 'suggested_reply': suggested_reply})


class TicketCategoryView(generics.ListCreateAPIView):
    serializer_class = TicketCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TicketCategory.objects.filter(company=self.request.user.company, is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class SupportStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        tickets = Ticket.objects.filter(company=company)
        stats = {
            'total': tickets.count(),
            'open': tickets.filter(status='open').count(),
            'in_progress': tickets.filter(status='in_progress').count(),
            'resolved': tickets.filter(status='resolved').count(),
            'escalated': tickets.filter(status='escalated').count(),
            'sla_breached': sum(1 for t in tickets.filter(status__in=['open', 'pending', 'in_progress']) if t.is_sla_breached),
        }
        return Response(stats)
