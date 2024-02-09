"""
ASGI config for transcande project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

# from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from asgiref.sync import async_to_sync

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcande.settings')

import app.pong as pong

application = get_asgi_application()

async def app(scope, receive, send):
	if scope['type'] == 'http':
		await application(scope, receive, send)
	else:
		await pong.wsapp(scope, receive, send)
