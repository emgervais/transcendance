FROM python:3.9.18-alpine

# Install the PostgreSQL and Redis client tools
RUN apk add --no-cache postgresql-client redis

RUN pip install --upgrade pip

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY cron /etc/cron.d/cron
RUN chmod 0644 /etc/cron.d/cron
RUN crontab /etc/cron.d/cron
RUN touch /var/log/cron.log

ENV TZ=America/New_York

# COPY . .
COPY init_checks.py .
COPY entrypoint.sh .

WORKDIR /usr/src/app
CMD ["./entrypoint.sh"]