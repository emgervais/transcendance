from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from users.models import User, FriendRequest, Friend

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
    
class FriendRequestsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'image']

# class FriendRequest(models.Model):
#     from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
#     to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests")
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     def __str__(self):
#         return f"{self.from_user} to {self.to_user}"
        
class FriendRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    action = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'action']
        
    def validate(self, data):
        username = data.get('username', None)
        action = data.get('action', None)
        
        if not User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'User does not exist'})
        if action not in ['send', 'accept', 'reject']:
            raise serializers.ValidationError({'action': 'Invalid action'})
        
        
        data['from_user'] = from_user = User.objects.get(pk=self.context['request'].user.id)
        data['to_user'] = to_user = User.objects.get(username=username)
        if action == 'send':
            temp = from_user
            from_user = to_user
            to_user = temp
        
        if action == 'send':
            if from_user == to_user:
                raise serializers.ValidationError({'username': 'Cannot send friend request to yourself'})
            if from_user.is_friend(to_user):
                raise serializers.ValidationError({'username': 'You are already friends with this user'})
            if from_user.has_sent_request(to_user):
                raise serializers.ValidationError({'username': 'Friend request already sent'})
        elif action == 'accept' or action == 'reject':
            if not to_user.has_received_request(from_user):
                raise serializers.ValidationError({'username': 'No friend request from this user'})
        print("validated data: ", data)
        return data
    
    def create(self, validated_data):
        from_user = validated_data['from_user']
        to_user = validated_data['to_user']
        action = validated_data['action']
        
        if action == 'send' or action == 'accept':
            if not to_user.has_received_request(from_user) and action != 'accept':
                FriendRequest.objects.create(from_user=to_user, to_user=from_user)
            else:
                Friend.objects.create(user=from_user, friend=to_user)
                Friend.objects.create(user=to_user, friend=from_user)
                from_user.get_friend_request(to_user).delete()
        elif action == 'reject':
            from_user.get_friend_request(to_user).delete()
        return validated_data
    
    def to_representation(self, instance):
        action = instance['action']
        if action == 'send':
            return {'message': 'Friend request sent'}
        elif action == 'accept':
            return {'message': 'Friend request accepted'}
        elif action == 'reject':
            return {'message': 'Friend request rejected'}
    
class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'image']
        
class RemoveFriendSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['username']
        
    def validate(self, data):
        username = data.get('username', None)
        
        if not User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'User does not exist'})
        
        from_user = self.context['request'].user
        to_user = User.objects.get(username=username)
        
        if not from_user.friend_list.filter(username=to_user.username).exists():
            raise serializers.ValidationError({'username': 'You are not friends with this user'})
        
        return data
    
    def delete(self, validated_data):
        from_user = self.context['request'].user
        to_user = User.objects.get(username=validated_data['username'])
        
        from_user.friend_list.filter(username=to_user.username).delete()
        to_user.friend_list.filter(username=from_user.username).delete()
        
        return validated_data