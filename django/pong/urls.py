from django.urls import path
from pong.views import StatsView, DetailedGameView, MatchHistoryView, WinsView, LossesView

urlpatterns = [
    path('stats/<int:pk>/', StatsView.as_view(), name='stats'), # pk is the user id
    path('game/<int:pk>/', DetailedGameView.as_view(), name='game'), # pk is the game id
    path('match-history/<int:pk>/', MatchHistoryView.as_view(), name='match_history'), # pk is the user id
    path('wins/<int:pk>/', WinsView.as_view(), name='wins'), # pk is the user id
    path('losses/<int:pk>/', LossesView.as_view(), name='losses'), # pk is the user id
]