from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import User, FriendRequest, Friend, FriendShipManager

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'image', 'oauth', 'matches', 'friends', 'friend_requests']
        read_only_fields = ['id', 'matches', 'friends', 'friend_requests']
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)

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
        return data
        
    def update(self, instance, validated_data):
        if 'username' in validated_data:
            instance.username = validated_data['username']
        if 'email' in validated_data:
            instance.email = validated_data['email']
        if 'image' in validated_data:
            if instance.image and instance.image != 'media/default/default.webp':
                print(instance.image)
                instance.image.delete(save=False)
            instance.image = validated_data.get('image', instance.image)
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
            ret['image'] = 'Image updated'
        if 'password1' in self.validated_data:
            ret['password'] = 'Password updated'
        return ret
    
class UserBasicInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'image']
        read_only_fields = ['id', 'username', 'image']

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
