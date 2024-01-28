from django.core.exceptions import ValidationError
from django.contrib.auth.backends import ModelBackend, BaseBackend
from users import oauth42
from users.models import User
from django.contrib.auth import get_user_model

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            raise ValidationError('Invalid email')
            return None

        if not user.check_password(password):
            raise ValidationError('Invalid password')
            return None
        return user

class OAuthBackend(BaseBackend):
    def authenticate(self, request, backend=None, **credentials) -> User:
        if backend != 'users.auth.OAuthBackend':
            return None
        username = credentials['username']
        email = credentials['email']
        query_set = User.objects.filter(username=username, email=email)
        if query_set.exists():
            user = query_set.first()
            return user if user.oauth else None
        if User.objects.filter(username=username).exists() \
            or User.objects.filter(email=email).exists():
            raise oauth42.AuthError("Your username and/or email is used by an existing account.")
        user = User.objects.create_user(**credentials, oauth=True)
        return user

    def get_user(self, id):
        try: 
            return User.objects.get(id=id)
        except User.DoesNotExist:
            return None