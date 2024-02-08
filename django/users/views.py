from __future__ import annotations
import sys

import django.conf
from django.http import HttpRequest, HttpResponse, JsonResponse
from users.forms import ChangeInfoForm
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from users import oauth42
from django.contrib import auth
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from .models import Friend_Request

User = get_user_model()

def oauth42_redirected(request):
    code = request.GET.get('code', None)
    # try:
    #     redirect_uri = django.conf.settings.OAUTH_REDIRECT_URL
    #     token = oauth42.get_user_token(code, redirect_uri)
    #     credentials = oauth42.get_user_data(token)
    #     user = authenticate(request, **credentials, backend='users.auth.OAuthBackend')
    #     auth.login(request, user)
    # except oauth42.AuthError as e:
    #     # form = LoginForm(data=request.POST)
    #     form.add_error(None, str(e))
    #     return render(request, 'auth/login.html', {'form': form})

    return redirect('index')

def get_oauth_uri(request):
    redirect_uri = django.conf.settings.OAUTH_REDIRECT_URL
    url = oauth42.create_oauth_uri(redirect_uri)
    return JsonResponse(url, safe=False)

def settings(request):
    template = "account/account.html"
    content_type = request.GET.get('content_type')

    if request.method == 'POST':
        user = request.user
        form = ChangeInfoForm(user, request.POST)

        try:
            if form.is_valid():
                username = form.cleaned_data.get('username')
                email = form.cleaned_data.get('email')

                if username:
                    user.username = username
                if email:
                    user.email = email

                user.save()
            else:
                return render(request, "account/fullinfo.html", {'form': form})
        except ValidationError as e:
            form.add_error(None, str(e))
    elif request.htmx:
        if content_type == 'stats':
            template = "account/stats.html"
        elif content_type == 'info':
            form = ChangeInfoForm(user=request.user)
            return render(request, "account/info.html", {'form': form})
        elif content_type == 'friends':
            all_users = User.objects.all()
            all_requests = Friend_Request.objects.all()
            friends = request.user.friends.all()
            template = "account/friends.html"
            return render(request, template, {'users': all_users, 'friend_requests': all_requests, 'friends': friends})

    return render(request, template)

def upload_img(request):
    if request.method =='POST':
        uploaded_image = request.FILES.get('photo')
        fs = FileSystemStorage(location='static/media/')
        filename = fs.save(uploaded_image.name, uploaded_image)
        #request.user.delete_old_image()
        request.user.image = f'/static/media/{filename}'
        request.user.save()
    return render(request, "account/account.html")

def send_friend_request(request, userID):
    from_user = request.user
    to_user = User.objects.get(id=userID)
    friend_request, created = Friend_Request.objects.get_or_create(
        from_user=from_user, to_user=to_user)
    if created:
        print('send created')
        return
    elif friend_request:
        print('request already sent')
        return
    else:
        print('failed')
        return

def accept_friend_request(request, requestID):
    friend_request = Friend_Request.objects.get(id=requestID)
    if friend_request.to_user == request.user:
        friend_request.to_user.friends.add(friend_request.from_user)
        friend_request.from_user.friends.add(friend_request.to_user)
        friend_request.delete()
        print('friend added_____')
        return
    else:
        print('friend add failed_____')
        return