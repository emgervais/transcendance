FROM python:3.9.18-alpine3.19

WORKDIR /usr/src/app

RUN apk update && apk add netcat-openbsd
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ./static/ ./static/

COPY ./entrypoint.sh .
CMD ["./entrypoint.sh"]