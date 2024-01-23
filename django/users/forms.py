from django import forms
from .models import User

class RegisterForm(forms.Form):
    name = forms.CharField(max_length=50)
    email = forms.EmailField()
    password = forms.CharField(max_length=50)

    def is_valid(self) -> bool:
        valid = super(RegisterForm, self).is_valid()
        if not valid:
            return False
        if User.objects.filter(email=self.cleaned_data['email']).exists():
            self.add_error('email', 'Email already exists')
            return False
        return True

class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(max_length=50)
    
    def get_user(self) -> User:
        return User.objects.get(email=self.cleaned_data['email'])
    
    def check_password(self, user: User) -> bool:
        return user.password == self.cleaned_data['password']
    
    def is_valid(self) -> bool:
        valid = super(LoginForm, self).is_valid()
        if not valid:
            return False
        if not User.objects.filter(email=self.cleaned_data['email']).exists():
            self.add_error('email', 'Email does not exist')
            return False
        elif not self.check_password(self.get_user()):
            self.add_error('password', 'Wrong password')
            return False
        return True