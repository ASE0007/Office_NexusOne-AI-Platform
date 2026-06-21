from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='inventory-categories'),
    path('suppliers/', views.SupplierListCreateView.as_view(), name='suppliers'),
    path('warehouses/', views.WarehouseListCreateView.as_view(), name='warehouses'),
    path('items/', views.InventoryItemListCreateView.as_view(), name='inventory-items'),
    path('items/<uuid:pk>/', views.InventoryItemDetailView.as_view(), name='inventory-item-detail'),
    path('movements/', views.StockMovementListCreateView.as_view(), name='stock-movements'),
    path('stats/', views.InventoryStatsView.as_view(), name='inventory-stats'),
]
