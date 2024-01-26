from __future__ import annotations
import sys

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import RegisterForm, LoginForm
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST
from django_htmx.middleware import HtmxDetails
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.urls import reverse
from users import oauth42
from django.contrib.auth import get_user_model
User = get_user_model()

class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails

def register(request: HtmxHttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = RegisterForm(request.POST)
        print("request.POST", request.POST)
        if form.is_valid():
            username=form.cleaned_data.get('username')
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password1')
            print("email", email)
            print("password", password)
            user = form.save()
            messages.success(request, f'Account created for {username}!')
            return render(request, 'index.html')
        else:
            print("INVALID FORM", form.errors)
            return render(request, 'auth/register.html', {'form': form})
    else:
        form = RegisterForm()
        return render(request, 'auth/register.html', {'form': form})

def login(request: HtmxHttpRequest) -> HttpResponse:
    context = {
        'logged': False,
        'form': LoginForm(),
    }
    template = 'auth/login.html'
    if request.method == "POST":
        context['form'] = LoginForm(request, request.POST)
        if context['form'].is_valid():
            email = context['form'].cleaned_data.get('email')
            password = context['form'].cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user is None:
                context['form'].add_error(None, "Wrong email or password.")
            else:
                messages.success(request, f'You are now logged in!')
                template = 'index.html'
                context['logged'] = request.user.is_authenticated
    return render(request, template, context)

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
    return redirect(reverse('index'))

def get_oauth_uri(request):
    redirect_uri = settings.OAUTH_REDIRECT_URL
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)
