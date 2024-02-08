from django.contrib import auth
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.contrib.auth import authenticate
from users.models import User
from users.serializers import UserSerializer
from auth.serializers import RegisterSerializer, LoginSerializer, LogoutSerializer
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return JsonResponse({'token': token.key}, status=status.HTTP_201_CREATED)
    
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validate(request.data)
        token, _ = Token.objects.get_or_create(user=user)
        return JsonResponse({'token': token.key}, status=status.HTTP_200_OK)
    
class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = request.auth
        token.delete()
        return JsonResponse({'message': 'User logged out successfully'}, status=status.HTTP_200_OK)
    
class UserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]
    
    def get(self, request: HttpRequest) -> JsonResponse:
        user = request.user
        serializer = self.serializer_class(user)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]
    
    def get(self, request: HttpRequest) -> JsonResponse:
        users = self.queryset.all()
        serializer = self.serializer_class(users, many=True)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)
    