from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import User
from friend.models import Friend
from django.conf import settings
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'image', 'status', 'oauth']
        read_only_fields = ['id', 'status', 'oauth']
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['image'] = "https://" + settings.ALLOWED_HOSTS[0] + instance.image.url
        ret['friendRequests'] = Friend.objects.requests(instance).count()
        return ret
    
class RestrictedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'image', 'status']
        # read_only_fields = ['id', 'username', 'image', 'status']
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['image'] = "https://" + settings.ALLOWED_HOSTS[0] + instance.image.url
        return ret

class ChangeInfoSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    image = serializers.ImageField(required=False)
    oldPassword = serializers.CharField(write_only=True, required=False)
    password1 = serializers.CharField(write_only=True, required=False)
    password2 = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'image', 'oldPassword', 'password1', 'password2']
        extra_kwargs = {'username': {'required': False}, 'email': {'required': False}, 'image': {'required': False},
                    'oldPassword': {'write_only': True, 'required': False}, 'password1': {'write_only': True, 'required': False},
                    'password2': {'write_only': True, 'required': False}}
        
    def validate(self, data):
        username = data.get('username', None)
        email = data.get('email', None)
        image = data.get('image', None)
        oldPassword = data.get('oldPassword', None)
        password1 = data.get('password1', None)
        password2 = data.get('password2', None)
        
        if oldPassword is not None and password1 is not None and password2 is not None:
            if not self.instance.check_password(oldPassword):
                raise serializers.ValidationError({'oldPassword': 'Old password is incorrect'})
            if password1 != password2:
                raise serializers.ValidationError({'password1': 'Passwords do not match'})
            validate_password(password1, self.instance)
        elif oldPassword is not None or password1 is not None or password2 is not None:
            raise serializers.ValidationError({'password1': 'All password fields are required'})
        
        if username is not None and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'Username already exists'})
        if email is not None and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Email already exists'})
        if image is not None and image.size > 2*1024*1024:
            raise serializers.ValidationError({'image': 'Image file too large'})
        if image is not None and re.match(r'^.*\.(jpg|jpeg|png|gif)$', image.name) is None:
            raise serializers.ValidationError({'image': 'Invalid image file type'})
        return data
        
    def update(self, instance, validated_data):
        if 'username' in validated_data:
            instance.username = validated_data['username']
        if 'email' in validated_data:
            instance.email = validated_data['email']
        if 'image' in validated_data:
            if instance.image.name != 'default/default.webp':
                instance.image.delete()
            instance.image.save(validated_data['image'].name, validated_data['image'])
        if 'password1' in validated_data:
            instance.set_password(validated_data['password1'])
        instance.save()
        return instance
    
    def to_representation(self, instance):
        ret = {}
        if 'username' in self.validated_data:
            ret['username'] = self.validated_data['username']
        if 'email' in self.validated_data:
            ret['email'] = self.validated_data['email']
        if 'image' in self.validated_data:
            ret['image'] = "https://" + settings.ALLOWED_HOSTS[0] + instance.image.url
        if 'password1' in self.validated_data:
            ret['password'] = 'Password updated'
        return ret