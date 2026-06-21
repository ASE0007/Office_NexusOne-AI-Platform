from django.urls import path
from . import views

urlpatterns = [
    path('customers/', views.CustomerListCreateView.as_view(), name='customer-list'),
    path('customers/<uuid:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<uuid:customer_id>/notes/', views.CustomerNotesView.as_view(), name='customer-notes'),
    path('customers/<uuid:customer_id>/documents/', views.CustomerDocumentsView.as_view(), name='customer-documents'),
    path('customers/<uuid:customer_id>/activities/', views.CustomerActivitiesView.as_view(), name='customer-activities'),
    path('leads/', views.LeadListCreateView.as_view(), name='lead-list'),
    path('leads/<uuid:pk>/', views.LeadDetailView.as_view(), name='lead-detail'),
    path('leads/<uuid:pk>/convert/', views.ConvertLeadView.as_view(), name='lead-convert'),
    path('stats/', views.CRMStatsView.as_view(), name='crm-stats'),
]
