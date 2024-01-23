from django.shortcuts import render

def pong(request):
    return render(request, 'pong.html')

def index(request):
    return render(request, 'index.html')