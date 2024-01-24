from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib import messages
from django.contrib.auth import authenticate
from users import oauth42

class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

@require_GET
def index(request: HtmxHttpRequest) -> HttpResponse:
    return render(request, "index.html")

@require_GET
def pong(request: HtmxHttpRequest) -> HttpResponse:
    return render(request, "pong.html")

@require_GET
def register(request: HtmxHttpRequest) -> HttpResponse:
    return render(request, "register.html", {"form": RegisterForm()})

@require_POST
def register_post(request: HtmxHttpRequest) -> HttpResponse:
    form = RegisterForm(request.POST)
    if form.is_valid():
        username=form.cleaned_data.get('username')
        user = form.save()
        messages.success(request, f'Account created for {username}!')
        return redirect("index")
    return render(request, "register.html", {"form": form})

@require_GET
def login(request: HtmxHttpRequest) -> HttpResponse:
    return render(request, "login.html", {"form": LoginForm()})

@require_POST
def login_post(request: HtmxHttpRequest) -> HttpResponse:
    form = LoginForm(request, data=request.POST)
    if form.is_valid():
        email=form.cleaned_data.get('email')
        user = authenticate(email=email, password=form.cleaned_data.get('password'))
        if user is not None:
            return render(request, 'login.html', {'form': form, 'logged': request.user.is_authenticated})
    messages.info(request, f'Wrong email or password')
    return render(request, 'login.html', {'form': form, 'logged': False})

@require_GET
def get_oauth_uri(request: HtmxHttpRequest) -> HttpResponse:
    return JsonResponse({"uri": oauth42.get_oauth_uri()})
