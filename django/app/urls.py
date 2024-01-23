from django.urls import path
from . import views

urlpatterns = [
	path("", views.index, name="login"),
    path("pong", views.pong, name="pong"),
]
