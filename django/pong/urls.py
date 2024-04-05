from django.urls import path
from pong.views import StatsView, MatchHistoryView, GameView

urlpatterns = [
    path('stats/<int:pk>/', StatsView.as_view(), name='stats'), # pk is the user id
    path('game/<int:pk>/', GameView.as_view(), name='game'), # pk is the game id
    path('match-history/<int:pk>/', MatchHistoryView.as_view(), name='match_history'), # pk is the user id
]