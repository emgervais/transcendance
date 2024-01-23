from django.shortcuts import render
from users import oauth42
from users.models import User

def pong(request):
    return render(request, 'pong.html')

def index(request):
    context = {
        'user': None,
    }    
    code = request.GET.get('code', None)
    if code is not None:
        token = oauth42.get_user_token(code, "https://localhost")
        data = oauth42.get_user_data(token)
        user = User(username= data['login'], email= data['email'], image= data['image'])
        context['user'] = user
    return render(request, 'index.html', context=context)  