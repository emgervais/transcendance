from django.http import JsonResponse, HttpRequest
from users.models import User, FriendRequest, Friend
from users.serializers import UserSerializer, ChangeInfoSerializer, ChangePasswordSerializer, FriendRequestSerializer, FriendSerializer, RemoveFriendSerializer, FriendRequestsSerializer
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

class UserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        user = User.objects.get(pk=pk)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class UsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        users = User.objects.all()
        return JsonResponse(self.serializer_class(users, many=True).data, status=status.HTTP_200_OK, safe=False)
    
class ChangeInfoView(generics.UpdateAPIView):
    serializer_class = ChangeInfoSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def put(self, request: HttpRequest) -> JsonResponse:
        user = User.objects.get(pk=request.user.id)
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        print("user.username:", user.username)
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    
    def put(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return JsonResponse({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)

class FriendRequestsView(generics.ListAPIView):
    serializer_class = FriendRequestsSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friend_requests = User.objects.get(pk=request.user.id).friend_requests.all()
        return JsonResponse(self.serializer_class(friend_requests, many=True).data, status=status.HTTP_200_OK, safe=False)

class FriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    
class FriendsView(generics.ListAPIView):
    serializer_class = FriendSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friends = request.user.friend_list.all()
        return JsonResponse(self.serializer_class(friends, many=True).data, status=status.HTTP_200_OK, safe=False)

class RemoveFriendView(generics.DestroyAPIView):
    serializer_class = RemoveFriendSerializer
    
    def delete(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return JsonResponse({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)
