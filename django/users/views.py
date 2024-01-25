from __future__ import annotations

from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib.auth import login as auth_login
from django.urls import reverse

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
        user = form.save()
        auth_login(request, user)
        return redirect(reverse("index"))
    return render(request, "register.html", {"form": form})

@require_GET
def login(request: HtmxHttpRequest) -> HttpResponse:
    return render(request, "login.html", {"form": LoginForm()})

@require_POST
def login_post(request: HtmxHttpRequest) -> HttpResponse:
    form = LoginForm(request, request.POST)
    if form.is_valid():
        user = form.get_user()
        auth_login(request, user)
        print("login_post", request.POST)
        return redirect(reverse("index"))
    return render(request, "login.html", {"form": form})

@require_GET
def get_oauth_uri(request: HtmxHttpRequest) -> HttpResponse:
    return JsonResponse({"uri": oauth42.get_oauth_uri()})
