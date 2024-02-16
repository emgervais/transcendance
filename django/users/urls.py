from django.urls import path
from users.views import UsersView, UserView, ChangeInfoView, FriendRequestView, FriendsView, RemoveFriendView, FriendRequestsView
    
urlpatterns = [
    path('', UsersView.as_view(), name='users'),
    path('user/<int:pk>/', UserView.as_view(), name='user'),
    path('change-info/', ChangeInfoView.as_view(), name='change_info'),
    path('friend-request/', FriendRequestView.as_view(), name='friend_request'),
    path('friend-requests/', FriendRequestsView.as_view(), name='friend_requests'),
    path('friends/', FriendsView.as_view(), name='friends'),
    path('remove-friend/', RemoveFriendView.as_view(), name='remove_friend'),
]