from django.http import JsonResponse, HttpRequest
from users.models import User, FriendRequest, Friend
from users.serializers import UserSerializer, ChangeInfoSerializer, FriendRequestSerializer, FriendSerializer
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

class UserView(APIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest, username: str) -> JsonResponse:
        user = User.objects.get(username=username)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class UsersView(APIView):
    serializer_class = UserSerializer
    
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

class FriendRequestListView(APIView):
    serializer_class = FriendRequestSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friend_requests = FriendRequest.objects.filter(to_user=request.user)
        return JsonResponse(self.serializer_class(friend_requests, many=True).data, status=status.HTTP_200_OK, safe=False)
    
    def post(self, request: HttpRequest) -> JsonResponse:
        try:
            from_user = request.user
            to_user = User.objects.get(pk=request.data['to_user'])
            request = Friend.objects.add_friend(from_user, to_user)
            return JsonResponse(self.serializer_class(request).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FriendRequestDetailView(APIView):
    serializer_class = FriendRequestSerializer
    
    def delete(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend_request = FriendRequest.objects.get(pk=pk)
            friend_request.delete()
            return JsonResponse({'message': 'Friend request removed successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend_request = FriendRequest.objects.get(pk=pk)
            if friend_request.to_user != request.user:
                raise serializers.ValidationError({'friend-request': 'You are not the recipient of this friend request'})
            friend_request.accept()
            return JsonResponse({'message': 'Friend request accepted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class FriendListView(APIView):
    serializer_class = FriendSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friends = Friend.objects.friends(request.user)
        return JsonResponse(self.serializer_class(friends, many=True).data, status=status.HTTP_200_OK, safe=False)
    
class FriendDetailView(APIView):
    serializer_class = FriendSerializer
    
    def delete(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend = Friend.objects.get(pk=pk)
            Friend.objects.remove_friend(request.user, friend.friend)
            return JsonResponse({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
