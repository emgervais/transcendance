from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from users.serializers import UserSerializerWithToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from users.models import User
    
class RegisterSerializer(UserSerializerWithToken):
    password1 = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta(UserSerializerWithToken.Meta):
        fields = UserSerializerWithToken.Meta.fields + ['password1', 'password2']
        extra_kwargs = {'username': {'required': True, 'allow_blank': False},
                        'email': {'required': True, 'allow_blank': False},
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
    
class LoginSerializer(UserSerializerWithToken):
    password = serializers.CharField(write_only=True)
    
    class Meta(UserSerializerWithToken.Meta):
        fields = UserSerializerWithToken.Meta.fields + ['password']
        extra_kwargs = {'username': {'required': False, 'allow_blank': True},
                        'email': {'required': True, 'allow_blank': False},
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