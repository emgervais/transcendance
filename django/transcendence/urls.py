from django.urls import include, path, re_path
from rest_framework.authtoken import views

urlpatterns = [
    path('', include('app.urls')),
    path('', include('users.urls')),
    path('api/', include('auth.urls')),
]
