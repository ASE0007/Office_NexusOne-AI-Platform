from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectListCreateView.as_view(), name='project-list'),
    path('<uuid:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:project_id>/milestones/', views.ProjectMilestonesView.as_view(), name='project-milestones'),
    path('<uuid:project_id>/kanban/', views.KanbanBoardView.as_view(), name='project-kanban'),
    path('stats/', views.ProjectStatsView.as_view(), name='project-stats'),
]
