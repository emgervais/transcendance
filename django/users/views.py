from django.http import JsonResponse, HttpRequest
from users.models import User
from users.serializers import UserSerializer, ChangeInfoSerializer
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser

class UserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        user = request.user
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class ChangeInfoView(generics.UpdateAPIView):
    serializer_class = ChangeInfoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def put(self, request: HttpRequest) -> JsonResponse:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.update(request.user, serializer.validated_data)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        users = User.objects.all()
        return JsonResponse(self.serializer_class(users, many=True).data, status=status.HTTP_200_OK, safe=False)