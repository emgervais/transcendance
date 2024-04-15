"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
# from app.routing import websocket_urlpatterns as app_websocket_urlpatterns
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from notification.routing import websocket_urlpatterns as notification_websocket_urlpatterns
from pong.routing import websocket_urlpatterns as pong_websocket_urlpatterns
from authentication.middleware import JWTAuthMiddlewareStack


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

application = ProtocolTypeRouter(
	{
		"http": django_asgi_app,
		"websocket": JWTAuthMiddlewareStack(
			AllowedHostsOriginValidator(
				URLRouter(
					chat_websocket_urlpatterns + notification_websocket_urlpatterns + pong_websocket_urlpatterns
				)
			)
		),
	}
)
