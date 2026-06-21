from django.urls import path
from . import views

urlpatterns = [
    path('', views.ApprovalListCreateView.as_view(), name='approval-list'),
    path('pending/', views.PendingApprovalsView.as_view(), name='approval-pending'),
    path('<uuid:pk>/', views.ApprovalDetailView.as_view(), name='approval-detail'),
    path('<uuid:pk>/action/', views.ApprovalActionView.as_view(), name='approval-action'),
]
