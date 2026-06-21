"""NexusOne AI - Inventory Serializers"""

from rest_framework import serializers
from .models import Category, Supplier, Warehouse, InventoryItem, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at']


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    available_quantity = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    category_name = serializers.SerializerMethodField()
    supplier_name = serializers.SerializerMethodField()
    warehouse_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_supplier_name(self, obj):
        return obj.supplier.name if obj.supplier else None

    def get_warehouse_name(self, obj):
        return obj.warehouse.name if obj.warehouse else None


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['id', 'company', 'performed_by', 'created_at']
