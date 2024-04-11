from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
        
class CustomAuthentication(JWTAuthentication):
    def authenticate(self, request):
        ignore_paths = ['/api/register/', '/api/login/', '/api/oauth42-login/', '/api/oauth42-uri/', '/api/refresh/']
        if request.path in ignore_paths:
            return None
        
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token