from django.urls import path
from . import views	
    
urlpatterns = [
    path("register", views.register, name="register"),
    path("login", views.login, name="login"),
    path("get-oauth-uri", views.get_oauth_uri, name="get_oauth_uri"),
]