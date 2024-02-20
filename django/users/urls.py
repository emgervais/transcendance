from django.urls import path
from users.views import UsersView, UserView, ChangeInfoView, ObtainInfoView, FriendRequestListView, FriendRequestDetailView, FriendListView, FriendDetailView

urlpatterns = [
    path('', ObtainInfoView.as_view(), name='obtain_info'),
    path('users/', UsersView.as_view(), name='users'),
    path('user/<int:pk>/', UserView.as_view(), name='user'),
    path('change-info/', ChangeInfoView.as_view(), name='change_info'),
    path('friend-requests/', FriendRequestListView.as_view(), name='friend-request-list'),
    path('friend-requests/<int:pk>/', FriendRequestDetailView.as_view(), name='friend-request-detail'),
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friends/<int:pk>/', FriendDetailView.as_view(), name='friend-detail'),
]