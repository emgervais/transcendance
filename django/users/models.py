
from django.db import models
from django.contrib.postgres.fields import ArrayField

class User(models.Model):
    username = models.CharField(max_length=150, default='default_username')
    email = models.EmailField()
    image = models.ImageField(upload_to='profile_pics', default='default.jpg')
    password = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    oauth = models.BooleanField(default=False)
    matches = models.ManyToManyField("self", through="PongMatch", symmetrical=False, related_name="user_matches", through_fields=('p1', 'p2'))

    def __str__(self):
        return self.username

class PongMatch(models.Model):
    p1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="p1_matches")
    p2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="p2_matches")
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="winner_matches", null=True, blank=True)
    score = ArrayField(models.IntegerField(), size=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.p1} vs {self.p2}"