from django.urls import path
from auth.views import RegisterView, LoginView, LogoutView, UserView, UserListView, OAuth42View, OAuth42RedirectedView

urlpatterns = [
    path('', UserListView.as_view(), name='users'),
    path('users/<int:pk>/', UserView.as_view(), name='user'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('oauth42/', OAuth42View.as_view(), name='oauth42'),
    path('oauth42-redirected/', OAuth42RedirectedView.as_view(), name='oauth42-redirected'),
]