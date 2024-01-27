from __future__ import annotations
import sys

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib.auth import authenticate, login
from django.contrib.auth import login as auth_login
from django.contrib import messages
from django.urls import reverse
from users import oauth42
from django.contrib.auth import get_user_model
User = get_user_model()


class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

def register(request: HtmxHttpRequest) -> HttpResponse:
    template = 'auth/register.html'
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            messages.success(request, "Account created successfully")
            template = 'index.html'
    else:
        form = RegisterForm()
    return render(request, template, {'form': form})

def login(request: HtmxHttpRequest) -> HttpResponse:
    template = 'auth/login.html'
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = authenticate(request, **form.cleaned_data)
            if user is not None:
                auth_login(request, user)
                messages.success(request, "Logged in successfully")
                template = 'index.html'
    else:
        form = LoginForm()
    return render(request, template, {'form': form})

def oauth42_redir(request):
    code = request.GET.get('code', None)
    try:
        redirect_uri = settings.OAUTH_REDIRECT_URL
        token = oauth42.get_user_token(code, redirect_uri)
        user_data = oauth42.get_user_data(token)
        
        email = user_data['email']
        username = user_data['login']
        print(f"email: {email}\n"
              f"username: {username}\n" + 
              f"image: {user_data['image']}\n" +  
              "if exists: use\n" + 
              "else: create\n" + 
              "login\n"
              )
        def _find_or_create():
            user = User.objects.filter(email=email).first() \
                or User.objects.filter(username=username).first()
            if not user:
                user = User.objects.create_user(username=username, email=email)
            user = authenticate(request, username=username, email=email)
            return user
        user = _find_or_create()
        if user is None:
            raise oauth42.AuthError("_____ Couldn't authenticate user.")
        login(request, user)
    except oauth42.AuthError as e:
        print(f"Error: {e}", file=sys.stderr)
        return redirect(reverse('login'))
    return redirect(reverse('index'))


@require_POST
def logout(request: HtmxHttpRequest) -> HttpResponse:
    request.session.flush()
    messages.success(request, "Logged out successfully")
    return redirect(reverse('index'))

def get_oauth_uri(request):
    redirect_uri = settings.OAUTH_REDIRECT_URL
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
