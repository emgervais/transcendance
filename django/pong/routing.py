from django.urls import re_path
from . import pong

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<gameid>\w+)/$', pong.wsapp),
]