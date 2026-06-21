from django.urls import path
from . import views

urlpatterns = [
    path('', views.TaskListCreateView.as_view(), name='task-list'),
    path('stats/', views.TaskStatsView.as_view(), name='task-stats'),
    path('<uuid:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('<uuid:task_id>/comments/', views.TaskCommentsView.as_view(), name='task-comments'),
    path('<uuid:task_id>/timelogs/', views.TimeLogView.as_view(), name='task-timelogs'),
    path('reorder/', views.UpdateTaskOrderView.as_view(), name='task-reorder'),
]
