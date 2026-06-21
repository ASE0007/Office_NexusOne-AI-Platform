from django.urls import path
from . import views

urlpatterns = [
    path('', views.CompanyDetailView.as_view(), name='company-detail'),
    path('create/', views.CompanyCreateView.as_view(), name='company-create'),
    path('stats/', views.CompanyStatsView.as_view(), name='company-stats'),
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<uuid:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
]
