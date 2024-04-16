#!/bin/sh

set -e                                      # exit shell if any process fails

if [ "$APP_ENV" != "production" ]; then
    export PYTHONDONTWRITEBYTECODE=1        # Don't compile Python
    export PYTHONUNBUFFERED=1               # Don't buffer stdout/err
fi

# Check if PostgreSQL is healthy
until PGPASSWORD=$POSTGRES_PASSWORD pg_isready -h postgres -U $POSTGRES_USER -d $POSTGRES_DB; do
    >&2 echo "PostgreSQL is unavailable. Waiting..."
    sleep 1
done

>&2 echo "PostgreSQL is up and ready"

# Check if Redis is healthy
until redis-cli -h redis ping; do
    >&2 echo "Redis is unavailable. Waiting..."
    sleep 1
done

>&2 echo "Redis is up and ready"

crond -L /var/log/cron.log && tail -f /var/log/cron.log &

./init_checks.py &&
python manage.py makemigrations &&
python manage.py migrate &&
python manage.py changestatus offline &&
daphne -b 0.0.0.0 -p $DJANGO_PORT transcendence.asgi:application