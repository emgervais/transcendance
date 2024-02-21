from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

# https://www.procoding.org/jwt-token-as-httponly-cookie-in-django
# CSRF?
class CustomAuthentication(JWTAuthentication):
    def authenticate(self, request):
        ignore_paths = ['/api/register/', '/api/login/', '/api/oauth42-login/', '/api/oauth42-uri/']
        if request.path in ignore_paths:
            return None
        
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        # enforce_csrf(request)
        return self.get_user(validated_token), validated_token