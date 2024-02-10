from rest_framework import serializers
from django.contrib.auth import authenticate
from users.models import User

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

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
        if password1 is None or password2 is None:
            raise serializers.ValidationError({'password': 'Password is required'})
        if password1 != password2:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        if len(password1) < 8:
            raise serializers.ValidationError({'password': 'Password must be at least 8 characters long'})
        
        return data
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['email', 'password']
    
    def validate(self, data):
        email = data.get('email', None)
        password = data.get('password', None)
        oauth = data.get('oauth', False)
        
        if oauth:
            raise serializers.ValidationError({'oauth': 'OAuth users need to login through OAuth'})
        if email is None:
            raise serializers.ValidationError({'email': 'Email is required to login'})
        if password is None:
            raise serializers.ValidationError({'password': 'Password is required to login'})
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Email is not registered. Please create an account'})
        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({'password': 'Invalid password'})
        return user
    
class LogoutSerializer(serializers.Serializer):
    token = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['token']
    
    def validate(self, data):
        token = data.get('token', None)
        if token is None:
            raise serializers.ValidationError({'token': 'Token is required to logout'})
        return data