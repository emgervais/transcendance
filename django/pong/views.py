from django.http import JsonResponse, HttpRequest
from users.models import User
from pong.models import Game
from pong.serializers import StatsSerializer, DetailedGameSerializer
from rest_framework import status
from rest_framework.views import APIView

class StatsView(APIView):
    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            user = User.objects.get(pk=pk)
            stats = Game.objects.get_stats(user)
            serializer = StatsSerializer(stats)
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
class GameView(APIView):
    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            game = Game.objects.get(pk=pk)
            serializer = DetailedGameSerializer(game)
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        except Game.DoesNotExist:
            return JsonResponse({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)

class MatchHistoryView(APIView):
    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            from_game_id = int(request.GET.get('from-game-id', 0))
            size = int(request.GET.get('size', 10))
            user = User.objects.get(pk=pk)
            games = Game.objects.get_games(user, from_game_id, size)
            serializer = DetailedGameSerializer(games, many=True)
            return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)