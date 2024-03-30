from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField

SEARCH_FILTERS = {
    'is-friend': 'friends__friend',
    'is-blocked': 'blocked_by__blocker',
    'got-blocked': 'blocked__blocked',
    'friend-request-sent': 'received_requests__from_user',
    'friend-request-received': 'sent_requests__to_user',
}

class UserManager(UserManager):
    def search(self, query, filters, user_id):
        users = self.filter(username__icontains=query).exclude(id=user_id)
        for filter_name, filter_value in filters.items():
            if filter_value:
                users = users.filter(**{SEARCH_FILTERS[filter_name]: user_id})
            else:
                users = users.exclude(**{SEARCH_FILTERS[filter_name]: user_id})
        return users
                

class User(AbstractUser):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='profile_pics', default='default/default.webp')
    status = models.CharField(max_length=10, default='offline')
    games = models.ManyToManyField('Game', blank=True)

    swear_count = models.IntegerField(default=0)
    ball_hit_count = models.IntegerField(default=0)
    longest_exchange = models.IntegerField(default=0)
    win_count = models.IntegerField(default=0)
    loss_count = models.IntegerField(default=0)
    ball_travel_length = models.IntegerField(default=0)
    
    
    objects = UserManager()
        
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
            
    def remove_all_channel_groups(self):
        self.channel_groups = {}
        self.main = ''
        self.save()
        
    def remove_group(self, group_name):
        for channel, group in self.channel_groups.items():
            if group == group_name:
                del self.channel_groups[channel]
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

# class PongMatch(models.Model):
#     p1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_p1')
#     p2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_p2')
#     score = ArrayField(models.IntegerField(), size=2, default=list)
#     created_at = models.DateTimeField(auto_now_add=True)
#     winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='won_matches', null=True, blank=True)

#     def save(self, *args, **kwargs):
#         # Determine the winner based on a score of 11
#         if self.score[0] == 11:
#             self.winner = self.p1
#         elif self.score[1] == 11:
#             self.winner = self.p2

#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f'{self.p1} vs {self.p2} ({self.score[0]}-{self.score[1]})'

class Game(models.Model):
    winner = models.ForeignKey(User, related_name='game_winner', on_delete=models.CASCADE)
    winner_score = models.IntegerField(default=0)
    loser = models.ForeignKey(User, related_name='game_loser', on_delete=models.CASCADE)
    loser_score = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.winner} vs {self.loser} ({self.winner_score}-{self.loser_score})'
