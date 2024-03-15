import functools
from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import serializers
from friend.models import Friend, FriendRequest, Block
from friend.serializers import FriendRequestSerializer, FriendSerializer, BlockSerializer
from users.models import User
from notification.utils import friend_request_notify, accept_friend_request_notify
from chat.consumers import close_blocked_user_chat

class FriendRequestListView(APIView):
    serializer_class = FriendRequestSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friend_requests = FriendRequest.objects.filter(to_user=request.user)
        return JsonResponse(self.serializer_class(friend_requests, many=True).data, status=status.HTTP_200_OK, safe=False)
    
    def post(self, request):
        try:
            from_user = request.user
            to_user_id = request.data.get('to_user')
            to_user = User.objects.get(pk=to_user_id)
            friend_request = Friend.objects.add_friend(from_user, to_user)
            friend_request_notify(from_user.id, to_user, friend_request.id)
            return JsonResponse(self.serializer_class(friend_request).data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return JsonResponse(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FriendRequestDetailView(APIView):
    serializer_class = FriendRequestSerializer
    
    def delete(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend_request = FriendRequest.objects.get(pk=pk)
            friend_request.delete()
            return JsonResponse({'message': 'Friend request removed successfully'}, status=status.HTTP_200_OK)
        except FriendRequest.DoesNotExist:
            return JsonResponse({'error': 'Friend request does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend_request = FriendRequest.objects.get(pk=pk)
            if friend_request.to_user != request.user:
                raise serializers.ValidationError({'friend-request': 'You are not the recipient of this friend request'})
            friend_request.accept()
            accept_friend_request_notify(request.user, friend_request.from_user)
            return JsonResponse({'message': 'Friend request accepted successfully'}, status=status.HTTP_200_OK)
        except FriendRequest.DoesNotExist:
            return JsonResponse({'error': 'Friend request does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class FriendListView(APIView):
    serializer_class = FriendSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        friends = Friend.objects.friends(request.user)
        return JsonResponse(self.serializer_class(friends, many=True).data, status=status.HTTP_200_OK, safe=False)
    
class OnlineFriendsCount(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        friends = Friend.objects.friends(request.user)
        count = functools.reduce(
            lambda count, friend: count + (friend.friend.status == "online"),
            friends, 0
        )
        return JsonResponse({"count": count}, status=status.HTTP_200_OK, safe=False)
    
class FriendDetailView(APIView):
    serializer_class = FriendSerializer
    
    def delete(self, request: HttpRequest, pk: int) -> JsonResponse:
        try:
            friend = Friend.objects.get(pk=pk)
            Friend.objects.remove_friend(request.user, friend.friend)
            return JsonResponse({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)
        except Friend.DoesNotExist:
            return JsonResponse({'error': 'Friend does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class BlockView(APIView):
    serializer_class = BlockSerializer
    
    def post(self, request: HttpRequest) -> JsonResponse:
        try:
            blocked = User.objects.get(pk=request.data['user_id'])
            Block.objects.block(request.user, blocked)
            close_blocked_user_chat(request.user, blocked)
            return JsonResponse({'message': 'User blocked successfully'}, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return JsonResponse(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request: HttpRequest) -> JsonResponse:
        try:
            blocked = User.objects.get(pk=request.data['user_id'])
            Block.objects.unblock(request.user, blocked)
            return JsonResponse({'message': 'User unblocked successfully'}, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return JsonResponse(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def get(self, request: HttpRequest) -> JsonResponse:
        blocked = Block.objects.blocked(request.user)
        return JsonResponse(self.serializer_class(blocked, many=True).data, status=status.HTTP_200_OK, safe=False)