FROM python:3.9.18-alpine3.19

WORKDIR /usr/src/app

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

# run this python3 manage.py flushexpiredtokens
RUN crontab -l | { cat; echo "* * * * * /usr/local/bin/python /usr/src/app/manage.py flushexpiredtokens"; } | crontab -

# COPY . .
COPY init_checks.py .
COPY entrypoint.sh .
CMD ["./entrypoint.sh"]