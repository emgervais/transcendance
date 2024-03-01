from django.urls import path
from users.views import UsersView, UserView, UserPkView, UserUsernameView, ChangeInfoView

urlpatterns = [
    path('users/', UsersView.as_view(), name='users'), #list of all users | Method: GET
    path('user/<int:pk>/', UserPkView.as_view(), name='user'), #detail of a user by id | Method: GET
    path('user/<str:username>/', UserUsernameView.as_view(), name='user'), #detail of a user by username | Method: GET
    path('user/', UserView.as_view(), name='user'), #get user info | Method: GET
    path('change-info/', ChangeInfoView.as_view(), name='change_info'), #change user info (username, email, image, password) | Method: PUT
]