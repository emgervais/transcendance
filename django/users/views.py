from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib.auth import authenticate
from django.contrib import messages
from django.urls import reverse

from users import oauth42

class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

def register(request: HtmxHttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            username=form.cleaned_data.get('username')
            user = form.save()
            messages.success(request, f'Account created for {username}!')
            return render(request, 'index.html')
        else:
            return render(request, 'auth/register.html', {'form': form})
    else:
        form = RegisterForm()
        return render(request, 'auth/register.html', {'form': form})

def login(request: HtmxHttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = LoginForm(request, request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user is not None:
                messages.success(request, f'You are now logged in!')
                return render(request, 'index.html', {'form': form, 'logged': request.user.is_authenticated})
            else:
                form.add_error(None, "Wrong email or password.")
        return render(request, 'auth/login.html', {'form': form, 'logged': request.user.is_authenticated})
    else:
        form = LoginForm()
        return render(request, 'auth/login.html', {'form': form, 'logged': request.user.is_authenticated})

@require_POST
def logout(request: HtmxHttpRequest) -> HttpResponse:
    request.session.flush()
    return redirect(reverse('index'))

def get_oauth_uri(request):
    redirect_uri = "https://localhost"
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
