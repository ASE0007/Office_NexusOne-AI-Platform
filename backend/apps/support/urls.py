from django.urls import path
from . import views

urlpatterns = [
    path('tickets/', views.TicketListCreateView.as_view(), name='ticket-list'),
    path('tickets/<uuid:pk>/', views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<uuid:ticket_id>/replies/', views.TicketRepliesView.as_view(), name='ticket-replies'),
    path('tickets/<uuid:pk>/ai-summary/', views.AITicketSummaryView.as_view(), name='ticket-ai-summary'),
    path('categories/', views.TicketCategoryView.as_view(), name='ticket-categories'),
    path('stats/', views.SupportStatsView.as_view(), name='support-stats'),
]
