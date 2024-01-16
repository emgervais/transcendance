from django.urls import path
from .views import index, salut

urlpatterns = [
    path('', index, name='index'),
    path('salut', salut, name='salut'),
]