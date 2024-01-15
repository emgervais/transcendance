FROM python:3.8.3-slim-buster

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y procps
RUN pip install --upgrade pip

COPY . .
RUN pip install -r requirements.txt

# RUN python manage.py migrate
CMD ["gunicorn", "transcande.wsgi:application", "--bind", "0.0.0.0:8000"]

