from django.urls import path
from users.views import UserListView, UserView, ChangeInfoView
    
urlpatterns = [
    path('', UserListView.as_view(), name='users'),
    path('user/<int:pk>/', UserView.as_view(), name='user'),
    path('change_info/', ChangeInfoView.as_view(), name='change_info'), 
]