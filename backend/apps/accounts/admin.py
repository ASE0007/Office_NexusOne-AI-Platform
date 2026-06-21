"""NexusOne AI - Accounts Admin"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, LoginHistory, ActiveSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'company', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_email_verified', 'company']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'last_login_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'bio', 'avatar')}),
        ('Company & Role', {'fields': ('company', 'role')}),
        ('Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_email_verified', 'is_2fa_enabled')}),
        ('Preferences', {'fields': ('timezone', 'language', 'theme', 'notification_preferences')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_login_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role', 'company'),
        }),
    )


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'device', 'browser', 'is_suspicious', 'created_at']
    list_filter = ['is_suspicious', 'created_at']
    readonly_fields = ['created_at']


@admin.register(ActiveSession)
class ActiveSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device', 'ip_address', 'is_active', 'last_activity', 'created_at']
    list_filter = ['is_active']
    readonly_fields = ['created_at']
