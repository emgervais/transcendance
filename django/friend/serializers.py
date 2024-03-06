from friend.models import Friend, FriendRequest, Block
from rest_framework import serializers

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user']
        read_only_fields = ['id', 'from_user']

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = ['id', 'user', 'friend']
        read_only_fields = ['id', 'user']

class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['id', 'blocker', 'blocked']
        read_only_fields = ['id', 'blocker']