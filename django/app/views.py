from django.shortcuts import render, redirect, reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

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

def delete(request):
    User = get_user_model()
    User.objects.all().delete()

def data(request):
    User = get_user_model()
    all_users = User.objects.all()
    user_data = []
    for user in all_users:
        user_data.append({
            'username': user.username,
            'email': user.email,
            'password': user.password,
        })

    return render(request, 'data.html', {'users': user_data})