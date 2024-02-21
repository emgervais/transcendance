from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from rest_framework import serializers

class User(AbstractUser, PermissionsMixin):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='profile_pics', default='default/default.webp')
    matches = models.ManyToManyField('self', through='PongMatch', symmetrical=False, related_name='user_matches', through_fields=('p1', 'p2'))
    friend_list = models.ManyToManyField('self', through='Friend', symmetrical=False, related_name='user_friends', through_fields=('friend', 'user'))
    friend_requests = models.ManyToManyField('self', through='FriendRequest', symmetrical=False, related_name='user_friend_requests', through_fields=('from_user', 'to_user'))

    def __str__(self):
        return self.username
    
class FriendShipManager(models.Manager):
    
    def friends(self, user):
        return user.friends.all()
    
    def requests(self, user):
        return user.received_requests.all()
    
    def sent_requests(self, user):
        return user.sent_requests.all()
    
    def add_friend(self, from_user, to_user):
        if from_user == to_user:
            raise serializers.ValidationError({'friend-request': 'Users cannot be friends with themselves'})

        if self.are_friends(from_user, to_user):
            raise serializers.ValidationError({'friend-request': 'Users are already friends'})

        if FriendRequest.objects.filter(
            from_user=from_user, to_user=to_user
        ).exists():
            raise serializers.ValidationError({'friend-request': 'You already requested friendship from this user.'})

        if FriendRequest.objects.filter(
            from_user=to_user, to_user=from_user
        ).exists():
            raise serializers.ValidationError({'friend-request': 'This user already requested friendship from you.'})

        request, created = FriendRequest.objects.get_or_create(
            from_user=from_user, to_user=to_user
        )
        
        if created is False:
            raise serializers.ValidationError({'friend-request': 'Friendship already requested'})

        return request
    
    def remove_friend(self, from_user, to_user):
        if not self.are_friends(from_user, to_user):
            raise serializers.ValidationError({'friend-request': 'Users are not friends'})
        
        Friend.objects.filter(user=from_user, friend=to_user).delete()
        Friend.objects.filter(user=to_user, friend=from_user).delete()
        
    def are_friends(self, user1, user2):
        return Friend.objects.filter(user=user1, friend=user2).exists()

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    created_at = models.DateTimeField(auto_now_add=True)

    def accept(self):
        Friend.objects.create(user=self.to_user, friend=self.from_user)
        Friend.objects.create(user=self.from_user, friend=self.to_user)
        self.delete()
        FriendRequest.objects.filter(from_user=self.to_user, to_user=self.from_user).delete()
    
    class Meta:
        verbose_name = _('Friend Request')
        verbose_name_plural = _('Friend Requests')
        unique_together = ('from_user', 'to_user')
    
    def __str__(self):
        return f'{self.from_user} -> {self.to_user}'
    
class Friend(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_of')
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = FriendShipManager()
    
    class Meta:
        verbose_name = _('Friend')
        verbose_name_plural = _('Friends')
        unique_together = ('user', 'friend')
    
    def __str__(self):
        return f'{self.user} -> {self.friend}'
    

class PongMatch(models.Model):
    p1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='p1_matches')
    p2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='p2_matches')
    score = ArrayField(models.IntegerField(), size=2, default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='won_matches', null=True, blank=True)

    def save(self, *args, **kwargs):
        # Determine the winner based on a score of 11
        if self.score[0] == 11:
            self.winner = self.p1
        elif self.score[1] == 11:
            self.winner = self.p2

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.p1} vs {self.p2} ({self.score[0]}-{self.score[1]})'