from __future__ import annotations
from django.urls import path
from users import views
    
urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("register-post/", views.register_post, name="register_post"),
    path("login-post/", views.login_post, name="login_post"),
    path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
]