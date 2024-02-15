from django.urls import path
from users.views import UsersView, UserView, ChangeInfoView, ChangePasswordView, FriendRequestView, FriendsView, RemoveFriendView, FriendRequestsView
    
urlpatterns = [
    path('', UsersView.as_view(), name='users'),
    path('user/<int:pk>/', UserView.as_view(), name='user'),
    path('change_info/', ChangeInfoView.as_view(), name='change_info'),
    path('change_password/', ChangePasswordView.as_view(), name='change_password'),
    path('friend_request/', FriendRequestView.as_view(), name='friend_request'),
    path('friend_requests/', FriendRequestsView.as_view(), name='friend_requests'),
    path('friends/', FriendsView.as_view(), name='friends'),
    path('remove_friend/', RemoveFriendView.as_view(), name='remove_friend'),
]