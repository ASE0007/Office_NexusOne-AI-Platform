from django.urls import path
from . import views

urlpatterns = [
    path('copilot/', views.AICopilotView.as_view(), name='ai-copilot'),
    path('insights/', views.AIBusinessInsightsView.as_view(), name='ai-insights'),
    path('revenue-analysis/', views.AIRevenueAnalysisView.as_view(), name='ai-revenue'),
    path('project-risks/', views.AIProjectRiskView.as_view(), name='ai-project-risks'),
    path('task-prioritization/', views.AITaskPrioritizationView.as_view(), name='ai-tasks'),
]
