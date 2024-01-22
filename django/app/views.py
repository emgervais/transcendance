from __future__ import annotations

import time
from dataclasses import dataclass

from django.http import HttpRequest
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, views as auth_views

class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

@require_GET
def index(request: HtmxHttpRequest):
    return render(request, "index.html")

@require_GET
def register(request: HtmxHttpRequest):
    form = UserCreationForm()
    return render(request, "register.html", {"form": form})

@require_POST
def register_post(request: HtmxHttpRequest):
    form = UserCreationForm(request.POST)
    if form.is_valid():
        user = form.save()
        login(request, user)  # Automatically log in the user after registration
        return redirect("index")  # Redirect to the index or another page
    return render(request, "register.html", {"form": form})

@require_GET
def login(request: HtmxHttpRequest):
    return auth_views.LoginView.as_view(template_name="login.html")(request)

@require_POST
def login_post(request: HtmxHttpRequest):
    return auth_views.LoginView.as_view(template_name="login.html")(request)