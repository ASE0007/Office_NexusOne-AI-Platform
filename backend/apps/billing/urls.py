from django.urls import path
from . import views

urlpatterns = [
    path('invoices/', views.InvoiceListCreateView.as_view(), name='invoice-list'),
    path('invoices/<uuid:pk>/', views.InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<uuid:invoice_id>/items/', views.InvoiceItemsView.as_view(), name='invoice-items'),
    path('invoices/<uuid:pk>/pdf/', views.GenerateInvoicePDFView.as_view(), name='invoice-pdf'),
    path('payments/', views.PaymentListCreateView.as_view(), name='payment-list'),
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense-list'),
    path('expenses/<uuid:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    path('stats/', views.BillingStatsView.as_view(), name='billing-stats'),
]
