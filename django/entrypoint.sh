#!/bin/bash
set -e

python manage.py migrate

python manage.py runserver 0.0.0.0:8000
# uvicorn transcande.asgi:application --bind 0.0.0.0:8000

