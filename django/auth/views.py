from django.http import JsonResponse, HttpRequest
from users.models import User
from auth.serializers import RegisterSerializer, LoginSerializer, OAuth42LoginSerializer, LogoutSerializer
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from auth.oauth42 import create_oauth_uri
from datetime import datetime
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import AccessToken

    
def set_cookies(response, user):
    refresh_token = TokenObtainPairSerializer().get_token(user)
    access_token = refresh_token.access_token    
    refresh_token_exp = datetime.fromtimestamp(refresh_token['exp'])
    access_token_exp = datetime.fromtimestamp(access_token['exp'])
    response.set_cookie('refresh_token', str(refresh_token), samesite='Strict', httponly=True, secure=True, expires=refresh_token_exp)
    response.set_cookie('access_token', str(access_token), samesite='Strict', httponly=True, secure=True, expires=access_token_exp)
    return response

# For development purposes only
class ResetDatabaseView(generics.DestroyAPIView):
    permission_classes = [AllowAny]
    def delete(self, request: HttpRequest) -> JsonResponse:
        try:
            User.objects.all().delete()
            return JsonResponse({'message': 'Database reset successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response = JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        return set_cookies(response, user)

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        response = JsonResponse(serializer.data, status=status.HTTP_200_OK)
        return set_cookies(response, user)

class LogoutView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LogoutSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = JsonResponse({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        response.delete_cookie('access_token')
        return response
    
class OAuth42UriView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    def get(self, request: HttpRequest) -> JsonResponse:
        uri = create_oauth_uri()
        return JsonResponse({'uri': uri}, status=status.HTTP_200_OK)

class OAuth42LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = OAuth42LoginSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        response = JsonResponse(serializer.data, status=status.HTTP_200_OK)
        print(user.image)
        print(user.image.url)
        return set_cookies(response, user)

class CustomTokenRefreshView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def post(self, request: HttpRequest) -> JsonResponse:
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return JsonResponse({'error': 'No refresh token found'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)
        response = JsonResponse(serializer.validated_data, status=status.HTTP_200_OK)
        access_token = serializer.validated_data['access']
        access_token_exp = datetime.fromtimestamp(AccessToken(access_token)['exp'])
        response.set_cookie('access_token', str(access_token), samesite='Strict', httponly=True, secure=True, expires=access_token_exp)
        return response