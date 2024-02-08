from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
import random
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

@receiver(post_save,sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

def random_default_image():
    #return random.choice(['/static/media/default/2.png', '/static/media/default/1.jpg'])
    return '/static/media/default/default.png'

class User(AbstractUser):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='media/', default=random_default_image)
    matches = models.ManyToManyField("self", through="PongMatch", symmetrical=False, related_name="user_matches", through_fields=('p1', 'p2'))
    friends = models.ManyToManyField("User", related_name='user_friends', blank=True)
    friend_requests = models.ManyToManyField("User", through="Friend_Request", related_name='user_friend_requests', blank=True)
    
    # Delete old image when a new one is uploaded
    def delete_old_image(self):
        default_images = ['/static/media/1.jpg', '/static/media/2.png'] 
        if self.image.name not in default_images:
            self.image.storage.delete(self.image.name)
    
    def __str__(self):
        return self.username

class Friend_Request(models.Model):
    from_user = models.ForeignKey(
        User, related_name='from_user', on_delete=models.CASCADE)
    to_user = models.ForeignKey(
        User, related_name='to_user', on_delete=models.CASCADE)

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