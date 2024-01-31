#!/bin/sh

set -e                                      # exit shell if any process fails

(cd app/pongbackend && python3 setup.py install)

if [ "$APP_ENV" != "production" ]; then
    export PYTHONDONTWRITEBYTECODE=1        # Don't compile Python
    export PYTHONUNBUFFERED=1               # Don't buffer stdout/err
    export PYTHONFAULTHANDLER=1             # Show Python stacktrace on error
fi

python manage.py migrate
python manage.py runserver 0.0.0.0:$DJANGO_PORT