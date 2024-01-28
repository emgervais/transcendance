from __future__ import annotations
import sys

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django_htmx.middleware import HtmxDetails
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib import messages
from django.urls import reverse
from users import oauth42
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError


User = get_user_model()


class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

def register(request: HtmxHttpRequest) -> HttpResponse:
    template = 'auth/register.html'
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, "Account created successfully")
            return redirect(reverse('index'))
    else:
        form = RegisterForm()
    return render(request, template, {'form': form})

def login(request: HtmxHttpRequest) -> HttpResponse:
    template = 'auth/login.html'
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            try:
                user = authenticate(request, email=email, password=password)
                if user is not None:
                    auth_login(request, user)
                    messages.success(request, "Logged in successfully")
                    return redirect(reverse('index'))
            except ValidationError as e:
                form = LoginForm(data=request.POST)
                form.add_error(None, str(e))
                return render(request, template, {'form': form})
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
        image = user_data['image']
        def _find_or_create():
            user = User.objects.get(email=email, oauth=True)
            print("user______", user)
            if not user:
                def _generate_username():
                    name = 'emile'
                    family = 'gervais'
                    for i in range(1, len(name) + 1):
                        username = (name[:i] + family)[:8]
                        if not User.objects.filter(username=username).exists():
                            break
                    number = 1
                    while True:    
                        if not User.objects.filter(username=username).exists():
                            break
                        username = name[0] + family[:8] + number
                        number +=1
                    return username
                username = _generate_username()
                print("user_______", username)
                user = User.objects.create_user(username=username, email=email, oauth=True, image=image)
            return user
        user = _find_or_create()
        if user is None:
            raise oauth42.AuthError("_____ Couldn't authenticate user.")
        auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    except oauth42.AuthError as e:
        print(f"Error: {e}", file=sys.stderr)
        return redirect(reverse('login'))
    return redirect(reverse('index'))

def logout(request: HtmxHttpRequest) -> HttpResponse:
    if request.method == 'POST':
        auth_logout(request)
        messages.success(request, "Logged out successfully")
    return render(request, "index.html")

def get_oauth_uri(request):
    redirect_uri = settings.OAUTH_REDIRECT_URL
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
