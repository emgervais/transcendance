#!/bin/sh

set -e                                      # exit shell if any process fails

if [ "$APP_ENV" != "production" ]; then
    export PYTHONDONTWRITEBYTECODE=1        # Don't compile Python
    export PYTHONUNBUFFERED=1               # Don't buffer stdout/err
fi

while ! nc -z postgres $POSTGRES_PORT; do   # wait for postgres to start
    sleep 1
done

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver 0.0.0.0:$DJANGO_PORT