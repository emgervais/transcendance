from django.shortcuts import render, redirect
from django.contrib.auth import authenticate
from .models import User
from .forms import RegisterForm, LoginForm
from django.http import JsonResponse
from django.contrib import messages
from . import oauth42


def register(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            username=form.cleaned_data.get('username')
            user = form.save()
            messages.success(request, f'Account created for {username}!')
            return render(request, 'index.html')
        else:
            return render(request, 'register.html', {'form': form})
    else:
        form = RegisterForm()
        return render(request, 'register.html', {'form': form})

def login(request):
    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user is not None:
                return render(request, 'login.html', {'form': form, 'logged': request.user.is_authenticated})
        else:
            return render(request, 'login.html', {'form': form})
    else:
        form = LoginForm()
        return render(request, 'login.html', {'form': form, 'logged': request.user.is_authenticated})

def get_oauth_uri(request):
    redirect_uri = "https://localhost"
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
