from django.urls import path
from . import views

urlpatterns = [
    path('employees/', views.EmployeeListCreateView.as_view(), name='employee-list'),
    path('employees/<uuid:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('attendance/', views.AttendanceListCreateView.as_view(), name='attendance-list'),
    path('attendance/today/', views.TodayAttendanceView.as_view(), name='attendance-today'),
    path('leaves/', views.LeaveRequestListCreateView.as_view(), name='leave-list'),
    path('leaves/<uuid:pk>/approve/', views.LeaveApprovalView.as_view(), name='leave-approve'),
    path('salaries/', views.SalaryRecordListView.as_view(), name='salary-list'),
    path('stats/', views.HRMStatsView.as_view(), name='hrm-stats'),
]
