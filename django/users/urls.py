from __future__ import annotations
from django.urls import path
from django.contrib.auth.views import LoginView
from users import views
    
urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("settings/", views.settings, name="settings"),
    path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
	path("oauth42-redirected/", views.oauth42_redirected, name="oauth42_redirected"),
]