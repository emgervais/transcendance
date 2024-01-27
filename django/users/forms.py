from django import forms
from .models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import get_user_model

class RegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password1', 'password2']
    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already taken. Please choose a different one.")
        return email

class LoginForm(AuthenticationForm):
    username = forms.CharField(label="Username or Email")
    class Meta:
        model = get_user_model()
        fields = ['username', 'password']
    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(email=username).exists():
            username = User.objects.get(email=username).username
        return username