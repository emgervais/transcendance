from django.db import models
from users.models import User

class Games(models.Model):
    winner_id = models.ForeignKey(User, on_delete=models.CASCADE)
    loser_id = models.ForeignKey(User, on_delete=models.CASCADE)
