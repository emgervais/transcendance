from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
import random

def random_default_image():
    #return random.choice(['/static/media/default/2.png', '/static/media/default/1.jpg'])
    return '/default/default.png'

class User(AbstractUser, PermissionsMixin):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='profile_pics', default=random_default_image)
    matches = models.ManyToManyField("self", through="PongMatch", symmetrical=False, related_name="user_matches", through_fields=('p1', 'p2'))
    friend_list = models.ManyToManyField("self", through="Friend", symmetrical=False, related_name="user_friends", through_fields=('user', 'friend'))
    friend_requests = models.ManyToManyField("self", through="FriendRequest", symmetrical=False, related_name="user_requests", through_fields=('from_user', 'to_user'))

    def is_friend(self, user):
        return self.friends.filter(friend=user).exists()
    
    def has_sent_request(self, user):
        return self.sent_requests.filter(to_user=user).exists()
    
    def has_received_request(self, user):
        return self.received_requests.filter(from_user=user).exists()
    
    def get_friend_request(self, user):
        return self.sent_requests.get(to_user=user)
    
    def __str__(self):
        return self.username

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('from_user', 'to_user')
    
    def __str__(self):
        return f"{self.from_user} to {self.to_user}"
    
class Friend(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friends")
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name="users")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'friend')

    def __str__(self):
        return f"{self.user} and {self.friend}"

class PongMatch(models.Model):
    p1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="p1_matches")
    p2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="p2_matches")
    score = ArrayField(models.IntegerField(), size=2, default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="won_matches", null=True, blank=True)

    def save(self, *args, **kwargs):
        # Determine the winner based on a score of 11
        if self.score[0] == 11:
            self.winner = self.p1
        elif self.score[1] == 11:
            self.winner = self.p2

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.p1} vs {self.p2} ({self.score[0]}-{self.score[1]})"