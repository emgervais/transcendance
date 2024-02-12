from django.http import JsonResponse, HttpRequest
from users.models import User
from users.serializers import UserSerializer, ChangeInfoSerializer
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser

class UserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest, pk: int) -> JsonResponse:
        user = User.objects.get(pk=pk)
        return JsonResponse(self.serializer_class(user).data, status=status.HTTP_200_OK)
    
class ChangeInfoView(generics.UpdateAPIView):
    serializer_class = ChangeInfoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def put(self, request: HttpRequest) -> JsonResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    
    def get(self, request: HttpRequest) -> JsonResponse:
        users = User.objects.all()
        return JsonResponse(self.serializer_class(users, many=True).data, status=status.HTTP_200_OK, safe=False)