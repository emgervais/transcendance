from django.urls import path
from . import views

urlpatterns = [
	path("", views.index, name="index.html"),
    path("pong", views.pong, name="pong.html"),
]
