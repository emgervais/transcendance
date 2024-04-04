from rest_framework import serializers
from pong.models import Game

class StatsSerializer(serializers.Serializer):
    swear_count = serializers.IntegerField()
    games = serializers.IntegerField()
    totals = serializers.DictField(child=serializers.IntegerField())
    averages = serializers.DictField(child=serializers.IntegerField())
    win_rate = serializers.IntegerField()
    most_played_opponent = serializers.DictField(child=serializers.CharField())

    def to_representation(self, instance):
        return {
            'swear_count': instance['swear_count'],
            'games': instance['games'],
            'totals': {
                'wins': instance['totals']['wins'],
                'losses': instance['totals']['losses'],
                'time_played': instance['totals']['time_played'],
                'longest_exchange': instance['totals']['longest_exchange'],
                'total_exchanges': instance['totals']['total_exchanges'],
                'total_distance': instance['totals']['total_distance'],
                'total_hits': instance['totals']['total_hits']
            },
            'averages': {
                'longest_exchange': instance['averages']['longest_exchange'],
                'total_exchanges': instance['averages']['total_exchanges'],
                'distance': instance['averages']['distance'],
                'hits': instance['averages']['hits'],
                'duration': instance['averages']['duration']
            },
            'win_rate': instance['win_rate'],
            'most_played_opponent': {
                'opponent': instance['most_played_opponent']['opponent'].username,
                'games': instance['most_played_opponent']['games']
            }
        }

class DetailedGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'winner', 'loser', 'score', 'date', 'duration', 'longest_exchange', 'total_exchanges', 'total_distance', 'total_hits']

