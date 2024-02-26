from django.urls import path
from auth.views import ResetDatabaseView, RegisterView, LoginView, LogoutView, OAuth42UriView, OAuth42LoginView, CustomTokenRefreshView

urlpatterns = [
    path('refresh-token/', CustomTokenRefreshView.as_view(), name='token_refresh'), # Custom token refresh view | Method: POST
    path('register/', RegisterView.as_view(), name='register'), # Register view | Method: POST
    path('login/', LoginView.as_view(), name='login'), # Login view | Method: POST
    path('logout/', LogoutView.as_view(), name='logout'), # Logout view | Method: POST
    path('oauth42-uri/', OAuth42UriView.as_view(), name='oauth42-uri'), # OAuth42 URI view | Method: GET
    path('oauth42-login/', OAuth42LoginView.as_view(), name='oauth42-redirected'), # OAuth42 login view | Method: GET
    path('reset/database/', ResetDatabaseView.as_view(), name='reset-database'),
]