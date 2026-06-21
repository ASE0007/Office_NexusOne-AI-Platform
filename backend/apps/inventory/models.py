"""NexusOne AI - Inventory Models"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='inventory_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_categories'


class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='suppliers')
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'suppliers'


class Warehouse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='warehouses')
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouses'


class InventoryItem(models.Model):
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    DISCONTINUED = 'discontinued'
    STATUS_CHOICES = [(ACTIVE, 'Active'), (INACTIVE, 'Inactive'), (DISCONTINUED, 'Discontinued')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='inventory_items')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True)

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)

    # Stock
    quantity = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0)
    minimum_stock = models.IntegerField(default=10)
    maximum_stock = models.IntegerField(default=1000)

    # Pricing
    cost_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')

    # Asset tracking
    serial_number = models.CharField(max_length=100, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to='inventory_items/', blank=True, null=True)
    tags = models.JSONField(default=list)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_items'
        ordering = ['name']
        unique_together = ['company', 'sku']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        return self.quantity <= self.minimum_stock


class StockMovement(models.Model):
    IN = 'in'
    OUT = 'out'
    TRANSFER = 'transfer'
    ADJUSTMENT = 'adjustment'

    TYPE_CHOICES = [
        (IN, 'Stock In'), (OUT, 'Stock Out'),
        (TRANSFER, 'Transfer'), (ADJUSTMENT, 'Adjustment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity = models.IntegerField()
    reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.movement_type == self.IN:
            self.item.quantity += self.quantity
        elif self.movement_type == self.OUT:
            self.item.quantity -= self.quantity
        self.item.save(update_fields=['quantity'])
