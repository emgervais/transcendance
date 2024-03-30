from django.urls import path
from pong.views import StatsView, DetailedGameView, MatchHistoryView, WinsView, LossesView

urlpatterns = [
    path('stats/<int:pk>/', StatsView.as_view(), name='stats'),
    path('game/<int:pk>/', DetailedGameView.as_view(), name='game'),
    path('match-history/<int:pk>/', MatchHistoryView.as_view(), name='match_history'),
    path('wins/<int:pk>/', WinsView.as_view(), name='wins'),
    path('losses/<int:pk>/', LossesView.as_view(), name='losses'),
]