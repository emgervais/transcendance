from django.db import models
from users.models import User
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

class FriendShipManager(models.Manager):
    
    def friends_count(self, user, online_only=False):
        if online_only:
            return user.friends.filter(friend__status='online').count()
        else:
            return user.friends.count()
        
    def online_friends(self, user, ids_only=False):
        friends = user.friends.all()
        online_friends = []
        
        for friend in friends:
            if friend.friend.status != 'offline':
                if ids_only:
                    online_friends.append(friend.friend.id)
                else:
                    online_friends.append(friend.friend)
        return online_friends
    
    def friends(self, user):
        return user.friends.all()
    
    def requests(self, user):
        return user.received_requests.all()
    
    def sent_requests(self, user):
        return user.sent_requests.all()
    
    def add_friend(self, from_user, to_user):
        if from_user == to_user:
            raise serializers.ValidationError({'friend-request': 'Users cannot be friends with themselves'})

        if Block.objects.is_blocked(to_user, from_user):
            raise serializers.ValidationError({'friend-request': 'User has blocked you'})
        
        if Block.objects.is_blocked(from_user, to_user):
            raise serializers.ValidationError({'friend-request': 'You have blocked this user'})
        
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
    
    def blocked_ids(self, user):
        return user.blocked.values_list('id', flat=True)
       
    def block(self, blocker, blocked):
        if blocker == blocked:
            raise serializers.ValidationError({'block': 'Users cannot block themselves'})
        
        block, created = Block.objects.get_or_create(blocker=blocker, blocked=blocked)
        
        if created is False:
            raise serializers.ValidationError({'block': 'User already blocked'})
        
        if Friend.objects.filter(user=blocker, friend=blocked).exists():
            Friend.objects.filter(user=blocker, friend=blocked).delete()
            Friend.objects.filter(user=blocked, friend=blocker).delete()
        
        if FriendRequest.objects.filter(from_user=blocker, to_user=blocked).exists():
            FriendRequest.objects.filter(from_user=blocker, to_user=blocked).delete()

        if FriendRequest.objects.filter(from_user=blocked, to_user=blocker).exists():
            FriendRequest.objects.filter(from_user=blocked, to_user=blocker).delete()

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

    objects = FriendShipManager()

    class Meta:
        db_table = 'friends'
        verbose_name = _('Friend')
        verbose_name_plural = _('Friends')
        unique_together = ('user', 'friend')
    
    def __str__(self):
        return f'{self.user} -> {self.friend}'
    
    def save(self, *args, **kwargs):
        if self.user == self.friend:
            raise serializers.ValidationError({'friend': 'Users cannot be friends with themselves'})
        
        super().save(*args, **kwargs)