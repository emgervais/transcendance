from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from rest_framework import serializers

class User(AbstractUser, PermissionsMixin):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='profile_pics', default='default/default.webp')
    status = models.CharField(max_length=10, default='offline')
    
    def __str__(self):
        return self.username
    
    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')

class UserChannelGroup(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    channel_groups = models.JSONField(default=dict)
    main = models.CharField(max_length=100, default='')
    
    # add a channel name to a group if the user is not part of the group
    def add_channel_group(self, channel_name, group_name):
        if channel_name not in self.channel_groups:
            self.channel_groups[channel_name] = group_name
            self.save()
            
    def remove_channel_group(self, channel_name):
        if channel_name in self.channel_groups:
            del self.channel_groups[channel_name]
            self.save()
            
    def in_group(self, group_name):
        return group_name in self.channel_groups.values()
    
    def get_channels(self):
        return list(self.channel_groups.keys())
    
    def get_group_names(self):
        groups = list(self.channel_groups.values())
        return groups
    
    def get_channel_name(self, group_name):
        for channel, group in self.channel_groups.items():
            if group == group_name:
                return channel
        return None
            
    class Meta:
        db_table = 'user_channel_groups'
    
    
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

        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            raise serializers.ValidationError({'friend-request': 'You already requested friendship from this user.'})

        if FriendRequest.objects.filter(from_user=to_user, to_user=from_user).exists():
            FriendRequest.objects.get(from_user=to_user, to_user=from_user).accept()
            return

        request, created = FriendRequest.objects.get_or_create(from_user=from_user, to_user=to_user)
        
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

class BlockManager(models.Manager):
    
    def blocked(self, user):
        return user.blocked.all()
    
    def blocked_by(self, user):
        return user.blocked_by.all()
       
    def block(self, blocker, blocked):
        if blocker == blocked:
            raise serializers.ValidationError({'block': 'Users cannot block themselves'})
        
        block, created = Block.objects.get_or_create(blocker=blocker, blocked=blocked)
        
        if created is False:
            raise serializers.ValidationError({'block': 'User already blocked'})
        
        if Friend.objects.filter(user=blocker, friend=blocked).exists():
            Friend.objects.filter(user=blocker, friend=blocked).delete()
            Friend.objects.filter(user=blocked, friend=blocker).delete()
        
        return block
    
    def unblock(self, blocker, blocked):
        if blocker == blocked:
            raise serializers.ValidationError({'block': 'Users cannot unblock themselves'})
        
        if not self.is_blocked(blocker, blocked):
            raise serializers.ValidationError({'block': 'User was not blocked'})
        
        Block.objects.filter(blocker=blocker, blocked=blocked).delete()
    
    def is_blocked(self, blocker, blocked):
        return Block.objects.filter(blocker=blocker, blocked=blocked).exists()    

class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = BlockManager()
    
    class Meta:
        db_table = 'blocks'
        verbose_name = _('Block')
        verbose_name_plural = _('Blocks')
        unique_together = ('blocker', 'blocked')
        
    def __str__(self):
        return f'{self.blocker} blocked {self.blocked}'
    
    def save(self, *args, **kwargs):
        if self.blocker == self.blocked:
            raise serializers.ValidationError({'block': 'Users cannot block themselves'})
        
        super().save(*args, **kwargs)

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
        db_table = 'friend_requests'
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
        db_table = 'friends'
        verbose_name = _('Friend')
        verbose_name_plural = _('Friends')
        unique_together = ('user', 'friend')
    
    def __str__(self):
        return f'{self.user} -> {self.friend}'
    

class PongMatch(models.Model):
    p1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_p1')
    p2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_p2')
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