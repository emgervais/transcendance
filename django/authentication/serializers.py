from rest_framework import serializers
from users.serializers import UserSerializer
from django.contrib.auth.password_validation import validate_password
from authentication.oauth42 import get_user_token, get_user_data
from users.utils import generate_username
from users.models import User
import requests
from django.core.files.base import ContentFile
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class RegisterSerializer(UserSerializer):
    password1 = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password1', 'password2']
        extra_kwargs = {'username': {'required': True},
                        'email': {'required': True},
                        'password1': {'write_only': True, 'required': True},
                        'password2': {'write_only': True, 'required': True}}
    
    def validate(self, data):
        username = data.get('username', None)
        email = data.get('email', None)
        password1 = data.get('password1', None)
        password2 = data.get('password2', None)
        
        if password1 != password2:
            raise serializers.ValidationError({'password1': 'Passwords do not match'})
        validate_password(password1)
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'Username already exists'})
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Email already exists'})
        
        return data

    def create(self, validated_data):
        username = validated_data.get('username', None)
        email = validated_data.get('email', None)
        password = validated_data.get('password1', None)
        
        user = User.objects.create_user(username, email, password)
        return user
    
class LoginSerializer(UserSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password']
        extra_kwargs = {'username': {'required': False},
                        'email': {'required': True},
                        'password': {'write_only': True, 'required': True}}
        
    def validate(self, data):
        email = data.get('email', None)
        password = data.get('password', None)
        
        user = User.objects.filter(email=email).first()
        if user is None:
            raise serializers.ValidationError({'email': 'User with this email does not exist'})
        if user.oauth is True:
            raise serializers.ValidationError({'email': 'This email is used by an OAuth account'})
        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Incorrect password'})

        return user
    
class OAuth42LoginSerializer(UserSerializer):
    code = serializers.CharField(write_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['code']
        extra_kwargs = {'username': {'required': False},
                        'email': {'required': False},
                        'code': {'write_only': True, 'required': True}}
        
    def validate(self, data):
        code = data.get('code', None)
        
        if code is None:
            raise serializers.ValidationError({'code': 'Code is required to login through OAuth'}) 
        try:
            token = get_user_token(code)
            user_data = get_user_data(token)
        except Exception as e:
            raise serializers.ValidationError({'code': str(e)})
            
        email = user_data['email']
        user = User.objects.filter(email=email).first()
        
        if user is not None and user.oauth is False:
            raise serializers.ValidationError({'email': 'Your email address is used by an existing account'})
        
        if user is None:
            username = generate_username(user_data['first_name'], user_data['last_name'])
            user = User.objects.create_user(username, email, None, oauth=True)
            if user_data['image'] is not None:
                response = requests.get(user_data['image'])
                user.image.save(f'{user.username}.jpg', ContentFile(response.content), save=False)
        
        user.oauth = True
        user.save()
        return user

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False)
    
    def validate(self, data):
        try:
            data['refresh'] = self.context['request'].COOKIES.get('refresh_token')
        except KeyError:
            raise serializers.ValidationError({'refresh': 'Refresh token is required'})
        return data
    
    def save(self):
        refresh_token = self.validated_data['refresh']
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError({'refresh': 'Invalid refresh token'})