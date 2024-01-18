FROM python:alpine3.18

WORKDIR /usr/src/app

# Don't compile Python (bad for prod, ok for development)
ENV PYTHONDONTWRITEBYTECODE 1
# Don't buffer stdout/err (bad for prod, ok for development)
ENV PYTHONUNBUFFERED 1

RUN apk update && apk add netcat-openbsd
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ./static/ ./static/

COPY ./entrypoint.sh .
CMD ["./entrypoint.sh"]