from django.urls import path
from users.views import UsersView, UserView, UserPkView, UserUsernameView, ChangeInfoView, FriendRequestListView, FriendRequestDetailView, FriendListView, FriendDetailView, BlockView

urlpatterns = [
    path('users/', UsersView.as_view(), name='users'), #list of all users | Method: GET
    path('user/<int:pk>/', UserPkView.as_view(), name='user'), #detail of a user by id | Method: GET
    path('user/<str:username>/', UserUsernameView.as_view(), name='user'), #detail of a user by username | Method: GET
    path('user/', UserView.as_view(), name='user'), #get user info | Method: GET
    path('change-info/', ChangeInfoView.as_view(), name='change_info'), #change user info (username, email, image, password) | Method: PUT
    path('friend-requests/', FriendRequestListView.as_view(), name='friend-request-list'), #list of all friend requests or send a friend request | Method: GET, POST
    path('friend-requests/<int:pk>/', FriendRequestDetailView.as_view(), name='friend-request-detail'), #accept or reject a friend request | Method: PUT, DELETE
    path('friends/', FriendListView.as_view(), name='friend-list'), #list of all friends | Method: GET
    path('friends/<int:pk>/', FriendDetailView.as_view(), name='friend-detail'), #remove a friend | Method: DELETE
    path('block/', BlockView.as_view(), name='block'), #block,unblock or get list of blocked users | Method: POST, DELETE, GET
]