from django.db import models
from users.models import User

class Game(models.Model):
    winner = models.ForeignKey(User, on_delete=models.CASCADE)
    winner_score = models.IntegerField(default=0)
    loser = models.ForeignKey(User, on_delete=models.CASCADE)
    loser_score = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.winner} vs {self.loser} ({self.winner_score}-{self.loser_score})'

    