from django.contrib import admin
from .models import CalendarEvent

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'start_datetime', 'end_datetime', 'created_by']
    list_filter = ['event_type', 'is_all_day']
    search_fields = ['title', 'description']
