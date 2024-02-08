from django.urls import include, path
from rest_framework.authtoken import views

urlpatterns = [
    path('', include('app.urls')),
    path('', include('users.urls')),
    path('api/', include('auth.urls')),
]
urlpatterns += [
    path('api-token-auth/', views.obtain_auth_token),
]
