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
    path("upload_img/", views.upload_img, name="upload_img"),
    path('send_friend_request/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('accept_friend_request/<str:username>/', views.accept_friend_request, name='accept_friend_request'),
]