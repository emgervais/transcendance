from django.urls import path
from auth.views import ResetDatabaseView, RegisterView, LoginView, LogoutView, OAuth42UriView, OAuth42LoginView, CustomTokenRefreshView

urlpatterns = [
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('oauth42-uri/', OAuth42UriView.as_view(), name='oauth42-uri'),
    path('oauth42-login/', OAuth42LoginView.as_view(), name='oauth42-redirected'),
    path('reset/database/', ResetDatabaseView.as_view(), name='reset-database'),
]