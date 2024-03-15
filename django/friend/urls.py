from django.urls import path
from friend.views import FriendRequestListView, FriendRequestDetailView, FriendListView, OnlineFriendsCount, FriendDetailView, BlockView

urlpatterns = [
    path('friend-requests/', FriendRequestListView.as_view(), name='friend-request-list'), #list of all friend requests or send a friend request | Method: GET, POST
    path('friend-requests/<int:pk>/', FriendRequestDetailView.as_view(), name='friend-request-detail'), #accept or reject a friend request | Method: PUT, DELETE
    path('friends/', FriendListView.as_view(), name='friend-list'), #list of all friends | Method: GET
    path('online-friends-count/', OnlineFriendsCount.as_view()), #number of online friends | Method: GET
    path('friends/<int:pk>/', FriendDetailView.as_view(), name='friend-detail'), #remove a friend | Method: DELETE
    path('block/', BlockView.as_view(), name='block'), #block,unblock or get list of blocked users | Method: POST, DELETE, GET
]