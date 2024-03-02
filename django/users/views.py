from django.http import JsonResponse, HttpRequest
from users.models import User
from users.serializers import UserSerializer, RestrictedUserSerializer, ChangeInfoSerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

class UserView(APIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        user = User.objects.get(pk=request.user.id)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class UserPkView(APIView):
    serializer_class = RestrictedUserSerializer

    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            user = User.objects.get(pk=pk)
            return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
class UserUsernameView(APIView):
    serializer_class = RestrictedUserSerializer

    def get(self, request: HttpRequest, username: str) -> JsonResponse:
        try:
            user = User.objects.get(username=username)
            return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return JsonResponse({'username': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
    
class UsersView(APIView):
    serializer_class = RestrictedUserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        users = User.objects.all()
        return JsonResponse(self.serializer_class(users, many=True).data, status=status.HTTP_200_OK, safe=False)
    
class ChangeInfoView(APIView):
    serializer_class = ChangeInfoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def put(self, request: HttpRequest) -> JsonResponse:
        try:
            user = User.objects.get(pk=request.user.id)
            serializer = self.serializer_class(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=status.HTTP_200_OK)
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ObtainInfoView(APIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        user = User.objects.get(pk=request.user.id)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class SearchView(APIView):
    serializer_class = RestrictedUserSerializer
    
    def get(self, request: HttpRequest, query: str) -> JsonResponse:
        users = User.objects.filter(username__contains=query)
        return JsonResponse(self.serializer_class(users, many=True).data, status=status.HTTP_200_OK, safe=False)