from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
import random


def random_default_image():
    return '/static/media/default/default.png'

class User(AbstractUser):
    oauth = models.BooleanField(default=False)
    image = models.ImageField(upload_to='media/', default=random_default_image)
    matches = models.ManyToManyField("self", through="PongMatch", symmetrical=False, related_name="user_matches", through_fields=('p1', 'p2'))
    # Add unique related_name for groups and user_permissions
    groups = models.ManyToManyField(
        Group,
        verbose_name=_("groups"),
        blank=True,
        help_text=_(
            "The groups this user belongs to. A user will get all permissions "
            "granted to each of their groups."
        ),
        related_name="app_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_("user permissions"),
        blank=True,
        help_text=_("Specific permissions for this user."),
        related_name="app_user_set",
        related_query_name="user",
    )

    def __str__(self):
        return self.username
    def delete_old_image(self):
        default_images = ['/static/media/1.jpg', '/static/media/2.png'] 
        if self.image.name not in default_images:
            self.image.storage.delete(self.image.name)

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
    
