from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("pong/", views.pong, name="pong"),
    path("data/", views.data, name="data"),
    path("delete/", views.delete, name="delete"),
    path("chat/", views.chat, name="chat"),
]
