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


from users.oauth42 import create_oauth_uri, get_user_token, get_user_data
from users.utils import generate_username
from django.conf import settings

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return JsonResponse({'token': token.key}, status=status.HTTP_201_CREATED)
    
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = []
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validate(request.data)
        token, _ = Token.objects.get_or_create(user=user)
        return JsonResponse({'token': token.key}, status=status.HTTP_200_OK)
    
class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = request.auth
        token.delete()
        return JsonResponse({'message': 'User logged out successfully'}, status=status.HTTP_200_OK)
    
class UserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        user = request.user
        serializer = self.serializer_class(user)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get(self, request: HttpRequest) -> JsonResponse:
        users = self.queryset.all()
        serializer = self.serializer_class(users, many=True)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK, safe=False)

class OAuth42View(generics.GenericAPIView):
    permission_classes = []
    
    def get(self, request: HttpRequest) -> JsonResponse:
        redirect_uri = settings.OAUTH_REDIRECT_URL
        url = create_oauth_uri(redirect_uri)
        return JsonResponse(url, safe=False)

class OAuth42RedirectedView(generics.GenericAPIView):
    permission_classes = []
    
    def get(self, request: HttpRequest) -> JsonResponse:
        try:
            code = request.GET.get('code')
            redirect_uri = settings.OAUTH_REDIRECT_URL
            token = get_user_token(code, redirect_uri)
            user_data = get_user_data(token)

            if User.objects.filter(email=user_data['email']).exists():
                user = User.objects.get(email=user_data['email'])
                if user.oauth:
                    token, _ = Token.objects.get_or_create(user=user)
                    return JsonResponse({'token': token.key}, status=status.HTTP_200_OK)
                else:
                    raise JsonResponse({'error': 'Your email address is used by an existing account.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                if User.objects.filter(username=user_data['username']).exists():
                    user_data['username'] = generate_username(user_data['first_name'], user_data['last_name'])
                user = User.objects.create_user(**user_data, oauth=True)
                token, _ = Token.objects.get_or_create(user=user)
                return JsonResponse({'token': token.key}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
