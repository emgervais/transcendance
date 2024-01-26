from __future__ import annotations
from django.urls import path
from users import views
    
urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("get-oauth-uri", views.get_oauth_uri, name="get_oauth_uri"),

    #path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
]