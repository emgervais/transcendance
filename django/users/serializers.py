from rest_framework import serializers
from users.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'image', 'oauth', 'matches', 'friends', 'friend_requests']
        read_only_fields = ['id', 'matches', 'friends', 'friend_requests']
        
class ChangeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'image']
        read_only_fields = ['username', 'email']
            
        def validate(self, data):
            username = data.get('username', None)
            email = data.get('email', None)
            image = data.get('image', None)
            
            if username is None and email is None and image is None:
                raise serializers.ValidationError({'info': 'No information was provided to change'})
            if username is not None and User.objects.filter(username=username).exists():
                raise serializers.ValidationError({'username': 'Username is already in use'})
            if email is not None and User.objects.filter(email=email).exists():
                raise serializers.ValidationError({'email': 'Email is already in use'})
            
            return data
        