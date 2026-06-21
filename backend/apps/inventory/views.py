"""NexusOne AI - Inventory Views"""

from rest_framework import generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Supplier, Warehouse, InventoryItem, StockMovement
from .serializers import (CategorySerializer, SupplierSerializer, WarehouseSerializer,
                          InventoryItemSerializer, StockMovementSerializer)


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class SupplierListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'email', 'contact_person']

    def get_queryset(self):
        return Supplier.objects.filter(company=self.request.user.company, is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class WarehouseListCreateView(generics.ListCreateAPIView):
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Warehouse.objects.filter(company=self.request.user.company, is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class InventoryItemListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'supplier', 'warehouse']
    search_fields = ['name', 'sku', 'barcode', 'serial_number']
    ordering_fields = ['name', 'quantity', 'created_at']

    def get_queryset(self):
        qs = InventoryItem.objects.filter(company=self.request.user.company)
        if self.request.query_params.get('low_stock'):
            qs = [item for item in qs if item.is_low_stock]
        return qs

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)


class InventoryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(company=self.request.user.company)


class StockMovementListCreateView(generics.ListCreateAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'item']

    def get_queryset(self):
        return StockMovement.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, performed_by=self.request.user)


class InventoryStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company = request.user.company
        items = InventoryItem.objects.filter(company=company)
        stats = {
            'total_items': items.count(),
            'low_stock_items': sum(1 for i in items if i.is_low_stock),
            'total_categories': Category.objects.filter(company=company).count(),
            'total_suppliers': Supplier.objects.filter(company=company, is_active=True).count(),
            'total_warehouses': Warehouse.objects.filter(company=company, is_active=True).count(),
        }
        return Response(stats)
