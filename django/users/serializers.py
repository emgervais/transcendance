from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'image', 'oauth', 'matches', 'friends', 'friend_requests']
        read_only_fields = ['id', 'matches', 'friends', 'friend_requests']
        
class UserSerializerWithToken(UserSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        token = TokenObtainPairSerializer().get_token(instance)
        data['refresh'] = str(token)
        data['access'] = str(token.access_token)
        return data

class ChangeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'image']
        extra_kwargs = {'username': {'required': False},
                        'image': {'required': False}}
        
        def validate(self, data):
            username = data.get('username', None)
            image = data.get('image', None)
            
            if username is not None and User.objects.filter(username=username).exists():
                raise serializers.ValidationError({'username': 'Username is already in use'})
            if image is not None and image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({'image': 'Image file is too large'})
            return data

        def update(self, instance, validated_data):
            if validated_data.get('username', None) is not None:
                instance.username = validated_data.get('username', instance.username)
            if validated_data.get('image', None) is not None:
                instance.image = validated_data.get('image', instance.image)
            
            instance.save()
            return instance