#!/bin/bash
set -e

# wait for postgres to start
while ! nc -z postgres 5432; do
    sleep 0.1
done

python manage.py migrate

python manage.py runserver 0.0.0.0:8000