from django.urls import path
from auth.views import RegisterView, LoginView, LogoutView, OAuth42View, OAuth42RedirectedView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('oauth42/', OAuth42View.as_view(), name='oauth42'),
    path('oauth42-redirected/', OAuth42RedirectedView.as_view(), name='oauth42-redirected'),
]