from django.http import JsonResponse, HttpRequest
from users.models import User
from users.serializers import UserSerializerWithToken
from auth.serializers import RegisterSerializer, LoginSerializer, LogoutSerializer, OAuth42LoginSerializer
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from auth.oauth42 import create_oauth_uri, get_user_token, get_user_data
from users.utils import generate_username
from django.conf import settings

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
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    
class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return JsonResponse({'message': 'User logged out'}, status=status.HTTP_200_OK)
    
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
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)