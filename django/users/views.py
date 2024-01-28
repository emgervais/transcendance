from __future__ import annotations
import sys

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django_htmx.middleware import HtmxDetails
from django.contrib import messages
from django.urls import reverse
from users import oauth42
from django.contrib import auth
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
            auth.login(request, user, backend='django.contrib.auth.backends.ModelBackend')
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
                    auth.login(request, user)
                    messages.success(request, "Logged in successfully")
                    return redirect(reverse('index'))
            except ValidationError as e:
                form = LoginForm(data=request.POST)
                form.add_error(None, str(e))
                return render(request, template, {'form': form})
    else:
        form = LoginForm()
    return render(request, template, {'form': form})

def oauth42_redirected(request):
    code = request.GET.get('code', None)
    try:
        redirect_uri = settings.OAUTH_REDIRECT_URL
        token = oauth42.get_user_token(code, redirect_uri)
        credentials = oauth42.get_user_data(token)
        user = authenticate(request, **credentials, backend='users.auth.OAuthBackend')
        if user is None:
            raise oauth42.AuthError("Couldn't authenticate user.")
        auth.login(request, user)
        return redirect('index')
    except oauth42.AuthError as e:
        form = LoginForm(data=request.POST)
        form.add_error(None, str(e))
        return render(request, 'auth/login.html', {'form': form})        

def logout(request: HtmxHttpRequest) -> HttpResponse:
    if request.method == 'POST':
        auth.logout(request)
        messages.success(request, "Logged out successfully")
    return render(request, "index.html")

def get_oauth_uri(request):
    redirect_uri = settings.OAUTH_REDIRECT_URL
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
