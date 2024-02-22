from channels.db import database_sync_to_async
from users.models import User
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware

from jwt import decode as jwt_decode
from django.conf import settings

class TokenAuthMiddleware(BaseMiddleware):
    @database_sync_to_async
    def get_user(self, token):
        try:
            payload = jwt_decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            return user
        except:
            return AnonymousUser()

    async def __call__(self, scope, receive, send):
        headers = dict(scope['headers'])
        if b'cookie' in headers:
            token_name, token_key = headers[b'cookie'].decode().split('=')
            if token_name == 'access_token':
                scope['user'] = await self.get_user(token_key)
        return await super().__call__(scope, receive, send)