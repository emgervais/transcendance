from django import forms
from users.models import User
from django.contrib.auth.forms import UserCreationForm

class ChangeInfoForm(UserCreationForm):
    username = forms.CharField(max_length=15, required=False)
    email = forms.EmailField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email']
    def __init__(self, user=None, *args, **kwargs):
        self.user = user
        super(ChangeInfoForm, self).__init__(*args, **kwargs)
        self.fields.pop('password1', None)
        self.fields.pop('password2', None)
    def clean_email(self):
        email = self.cleaned_data['email']
        if email:
            if self.user.oauth:
                raise forms.ValidationError("Email cannot be updated for 42 account")
            if User.objects.filter(email=email).exists():
                raise forms.ValidationError("This email is already taken. Please choose a different one.")
        return email
    #def clean_username(self):
    #    username = self.cleaned_data['username']
    #    if User.objects.filter(username=username).exists():
    #        print("HELP")
    #        raise forms.ValidationError("This username is already taken. Please choose a different one.")
    #    return username