from django.core.exceptions import ValidationError
from django.contrib.auth.backends import ModelBackend, BaseBackend
from users import oauth42
from users.utils import generate_username
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            raise ValidationError('Invalid email')
        if not user.check_password(password):
            raise ValidationError('Invalid password')
        return user


class OAuthBackend(BaseBackend):
    def authenticate(self, request, backend=None, **credentials) -> UserModel:
        if backend != 'users.auth.OAuthBackend':
            return None
        username = credentials['username']
        email = credentials['email']
        query_set = UserModel.objects.filter(email=email)
        if query_set.exists():
            user = query_set.first()
            if user.oauth:
                return user
            raise oauth42.AuthError("Your email address is used by an existing account.")
        if UserModel.objects.filter(username=username).exists():
            credentials['username'] = generate_username(
                first_name=credentials['first_name'],
                last_name=credentials['last_name']
            )
        user = UserModel.objects.create_user(**credentials, oauth=True)
        return user

    def get_user(self, id):
        try: 
            return UserModel.objects.get(id=id)
        except UserModel.DoesNotExist:
            return None