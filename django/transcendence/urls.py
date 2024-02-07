from django.urls import include, path

urlpatterns = [
    path('', include('app.urls')),
    path('', include('users.urls')),
]
