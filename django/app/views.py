from django.shortcuts import render, redirect, reverse
from django.contrib.auth.decorators import login_required
from users.forms import ChangeInfoForm
from django.contrib.auth import get_user_model
from functools import wraps
from django.http import JsonResponse

def api_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        else:
            return JsonResponse({'error': 'Authentication required'}, status=401)

    return _wrapped_view

@api_login_required
def pong(request):
    return render(request, 'pong.html')

def index(request):
    context = {
        'user': request.user,

        'changeInfoForm': ChangeInfoForm(),
    }    
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
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password': user.password,
        })

    return render(request, 'data.html', {'users': user_data})

def chat(request):
    return render(request, 'chat.html')
