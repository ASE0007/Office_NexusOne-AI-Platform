"""NexusOne AI - Calendar Serializers"""

from rest_framework import serializers
from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    project_title = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    attendee_names = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_datetime', 'end_datetime', 'is_all_day',
            'location', 'meeting_link', 'color', 'reminder_minutes',
            'project', 'project_title', 'customer', 'customer_name',
            'task', 'attendees', 'attendee_names',
            'is_recurring', 'recurrence_rule',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_project_title(self, obj):
        return obj.project.title if obj.project else None

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else None

    def get_attendee_names(self, obj):
        return [u.full_name for u in obj.attendees.all()]

    def create(self, validated_data):
        attendees = validated_data.pop('attendees', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        if hasattr(request.user, 'company') and request.user.company:
            validated_data['company'] = request.user.company
        event = super().create(validated_data)
        if attendees:
            event.attendees.set(attendees)
        return event
