from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', include('app.urls')),
    path('api/', include('users.urls')),
    path('api/', include('authentication.urls')),
    path('api/', include('friend.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)