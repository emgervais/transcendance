from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager
from django.utils.translation import gettext_lazy as _

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
    swear_count = models.IntegerField(default=0)
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