from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
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

# Create a serializer for changing user info
# This serializer will be used to change the username and image of a user
# It will also be used to delete the old image if a new one is uploaded
class ChangeInfoSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)
    
    class Meta:
        model = User
        fields = ['username', 'image']
        extra_kwargs = {'username': {'required': False}, 'image': {'required': False}}
        
    def validate(self, data):
        username = data.get('username', None)
        image = data.get('image', None)
        
        if username is not None and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'Username already exists'})
        if image is not None and image.size > 2*1024*1024:
            raise serializers.ValidationError({'image': 'Image file too large'})
        return data
        
    def update(self, instance, validated_data):
        image = validated_data.get('image', None)
        username = validated_data.get('username', None)
        
        if image is not None and instance.image != '/static/media/default/default.png':
            instance.image.delete(save=False)
        if username is not None and User.objects.filter(username=username).exists() and username != '':
            instance.username = validated_data.get('username', instance.username)
        if image is not None:
            instance.image = validated_data.get('image', instance.image)
        instance.save()
        return instance
    
        
class ChangePasswordSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(write_only=True, required=True)
    password1 = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['old_password', 'password1', 'password2']
        
    def validate(self, data):
        old_password = data.get('old_password', None)
        password1 = data.get('password1', None)
        password2 = data.get('password2', None)
        
        if not self.instance.check_password(old_password):
            raise serializers.ValidationError({'old_password': 'Old password is incorrect'})
        if password1 != password2:
            raise serializers.ValidationError({'password1': 'Passwords do not match'})
        validate_password(password1)
        
        return data
    
    def update(self, instance, validated_data):
        instance.set_password(validated_data.get('password1'))
        instance.save()
        return instance