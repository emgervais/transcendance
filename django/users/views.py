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

@require_GET
def register(request: HtmxHttpRequest) -> HttpResponse:
    print(request.htmx)
    print(request)
    return render(request, 'auth/register.html', {'form': RegisterForm()})

@require_GET
def login(request: HtmxHttpRequest) -> HttpResponse:
    print(request.htmx)
    print(request)
    form = LoginForm()
    return render(request, 'auth/login.html', {'form': form, 'logged': request.user.is_authenticated})

@require_POST
def register_post(request: HtmxHttpRequest) -> HttpResponse:
    form = RegisterForm(request.POST)
    if form.is_valid():
        form.save()
        username=form.cleaned_data.get('username')
        authenticate(username=username, password=form.cleaned_data.get('password1'))
        messages.success(request, f'Account created for {username}!')
        return redirect(reverse('index'))
    return render(request, 'auth/register.html', {'form': form})

@require_POST
def login_post(request: HtmxHttpRequest) -> HttpResponse:
    form = LoginForm(request, request.POST)
    if form.is_valid():
        email = form.cleaned_data.get('email')
        password = form.cleaned_data.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            messages.success(request, f'You are now logged in!')
            return render(request, 'auth/login.html', {'form': form, 'logged': request.user.is_authenticated})
        else:
            form.add_error(None, "Wrong email or password.")
    return render(request, 'auth/login.html', {'form': form, 'logged': request.user.is_authenticated})

@require_POST
def logout(request: HtmxHttpRequest) -> HttpResponse:
    request.session.flush()
    return redirect(reverse('index'))
