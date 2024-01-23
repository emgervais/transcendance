from django.shortcuts import render
from .models import User
from .forms import RegisterForm, LoginForm

def register(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = User(name=form.cleaned_data['name'], email=form.cleaned_data['email'], password=form.cleaned_data['password'])
            user.save()
            return render(request, 'index.html')
        else:
            return render(request, 'register.html', {'form': form})
    else:
        form = RegisterForm()
        return render(request, 'register.html', {'form': form})

def login(request):
    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            request.session['user_id'] = form.get_user().id
            return render(request, 'index.html')
        else:
            return render(request, 'login.html', {'form': form})
    else:
        form = LoginForm()
        return render(request, 'login.html', {'form': form})
