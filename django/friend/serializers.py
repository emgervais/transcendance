from friend.models import Friend, FriendRequest, Block
from rest_framework import serializers

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'created_at']
        read_only_fields = ['id', 'from_user', 'created_at']

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = ['id', 'user', 'friend', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['id', 'blocker', 'blocked', 'created_at']
        read_only_fields = ['id', 'blocker', 'created_at']