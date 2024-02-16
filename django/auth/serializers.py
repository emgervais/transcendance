from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from users.serializers import UserSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from auth.oauth42 import get_user_token, get_user_data
from users.utils import generate_username
from django.conf import settings
from users.models import User

class RegisterSerializer(UserSerializer):
    password1 = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password1', 'password2']
        extra_kwargs = {'username': {'required': True},
                        'email': {'required': True},
                        'password1': {'write_only': True, 'required': True},
                        'password2': {'write_only': True, 'required': True}}
        
    def create(self, validated_data):
        username = validated_data.get('username', None)
        email = validated_data.get('email', None)
        password = validated_data.get('password1', None)
        
        user = User.objects.create_user(username, email, password)
        return user
    
    def validate(self, data):
        username = data.get('username', None)
        email = data.get('email', None)
        password1 = data.get('password1', None)
        password2 = data.get('password2', None)
        oauth = data.get('oauth', False)
        
        if oauth:
            raise serializers.ValidationError({'oauth': 'OAuth users cannot register'})
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'Username is already in use'})
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Email is already in use'})
        if password1 != password2:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        
        return data
    
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
        oauth = data.get('oauth', False)
        
        if oauth:
            raise serializers.ValidationError({'oauth': 'OAuth users need to login through OAuth'})
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Email is not registered. Please create an account'})
        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({'password': 'Invalid password'})

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
        token = get_user_token(code)
        user_data = get_user_data(token)
        email = user_data['email']
        user = User.objects.filter(email=email).first()
        if user is not None and user.oauth is False:
            raise serializers.ValidationError({'email': 'Your email address is used by an existing account'})
        if user is None:
            username = generate_username(user_data['first_name'], user_data['last_name'])
            user = User.objects.create_user(username, email, None, oauth=True, image=user_data['image'])
            
        return user


class LogoutSerializer(serializers.ModelSerializer):
    refresh = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['refresh']
        extra_kwargs = {'refresh': {'write_only': True}}
        
    def validate(self, data):
        refresh = data.get('refresh', None)
        
        if refresh is None:
            raise serializers.ValidationError({'refresh': 'Refresh token is required to logout'})
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError({'refresh': 'Invalid refresh token'})
        
        return data