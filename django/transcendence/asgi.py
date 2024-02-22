"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
# from app.routing import websocket_urlpatterns as app_websocket_urlpatterns
from chat.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

application = ProtocolTypeRouter(
	{
		"http": get_asgi_application(),
		"websocket": JWTAuthMiddlewareStack(
			AllowedHostsOriginValidator(
				URLRouter(
					websocket_urlpatterns
				)
			)
		),
	}
)
