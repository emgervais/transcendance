from django.urls import path
from . import views

urlpatterns = [
	path("", views.index, name="index"),
    path("pong", views.pong, name="pong"),
	path("register", views.register, name="register"),
    path("login", views.login, name="login"),
]
