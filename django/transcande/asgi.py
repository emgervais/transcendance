"""
ASGI config for transcande project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

# from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path

from app.pong import ws_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcande.settings')

# application = get_asgi_application()
dj_application = get_asgi_application()

async def application(scope, receive, send):
	if scope['type'] == 'http':
		await dj_application(scope, receive, send)
	elif scope['type'] == 'websocket':
		if scope['path'] == '/ws/pong/':
			await ws_application(scope, receive, send)
	else:
		raise NotImplementedError(f"Unknown scope type {scope['type']}")
