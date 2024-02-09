from django.urls import path
from users import views
    
urlpatterns = [
    path("settings/", views.settings, name="settings"),
    # path("get-oauth-uri/", views.get_oauth_uri, name="get_oauth_uri"),
	# path("oauth42-redirected/", views.oauth42_redirected, name="oauth42_redirected"),
    path("upload_img/", views.upload_img, name="upload_img"),
    path('send_friend_request/<int:userID>/', views.send_friend_request, name='send_friend_request'),
    path('accept_friend_request/<int:requestID>/', views.accept_friend_request, name='accept_friend_request'),
]