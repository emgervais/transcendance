from django.shortcuts import render, redirect, reverse
from django.contrib.auth.decorators import login_required

@login_required
def pong(request):
    return render(request, 'pong.html')

# @login_required
def index(request):
    print("_____INDEX")
    context = {
        'user': request.user,
    }    
    print("user:", request.user)
    return render(request, 'index.html', context=context)