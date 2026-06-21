from django.urls import path
from . import views

urlpatterns = [
    path('folders/', views.DocumentFolderListCreateView.as_view(), name='document-folders'),
    path('folders/<uuid:pk>/', views.DocumentFolderDetailView.as_view(), name='document-folder-detail'),
    path('stats/', views.DocumentStatsView.as_view(), name='document-stats'),
    path('', views.DocumentListCreateView.as_view(), name='document-list'),
    path('<uuid:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
]
