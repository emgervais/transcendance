from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return render(request, 'pong/index.html')

def salut(request):
    return render(request, 'salut.html')