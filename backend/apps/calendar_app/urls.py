"""NexusOne AI - Calendar URLs"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet

router = DefaultRouter()
router.register('events', CalendarEventViewSet, basename='calendar-event')

urlpatterns = [
    path('', include(router.urls)),
]
