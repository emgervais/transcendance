from django.urls import path
from auth.views import RegisterView, LoginView, LogoutView, UserView, UserListView

urlpatterns = [
    path('', UserListView.as_view(), name='users'),
    path('users/<int:pk>/', UserView.as_view(), name='user'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]