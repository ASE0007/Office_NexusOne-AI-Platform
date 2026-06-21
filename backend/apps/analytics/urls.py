from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('revenue/', views.RevenueReportView.as_view(), name='revenue-report'),
    path('customers/', views.CustomerAnalyticsView.as_view(), name='customer-analytics'),
    path('employees/', views.EmployeeAnalyticsView.as_view(), name='employee-analytics'),
]
