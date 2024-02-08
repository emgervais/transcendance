from rest_framework import serializers
from users.models import User

## users/models.py
# class User(AbstractUser, PermissionsMixin):
#     oauth = models.BooleanField(default=False)
#     image = models.ImageField(upload_to='media/', default=random_default_image)
#     matches = models.ManyToManyField("self", through="PongMatch", symmetrical=False, related_name="user_matches", through_fields=('p1', 'p2'))
#     friends = models.ManyToManyField("User", related_name='user_friends', blank=True)
#     friend_requests = models.ManyToManyField("User", through="Friend_Request", related_name='user_friend_requests', blank=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'oauth', 'image', 'matches', 'friends', 'friend_requests']
        read_only_fields = ['id', 'matches', 'friends', 'friend_requests']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'oauth': {'required': False},
            'image': {'required': False},
        }