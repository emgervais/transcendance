from __future__ import annotations
from django.urls import path
from users import views
    
urlpatterns = [
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login, name="login"),
    path("auth/register-post/", views.register_post, name="register_post"),
    path("auth/login-post/", views.login_post, name="login_post"),
    path("logout/", views.logout, name="logout"),

    #path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
]