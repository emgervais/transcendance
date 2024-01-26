from __future__ import annotations
from django.urls import path
from django.contrib.auth.views import LoginView
from users import views
    
urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
	path("oauth42-redirect/", views.oauth42_redir, name="oauth42_redir")
]