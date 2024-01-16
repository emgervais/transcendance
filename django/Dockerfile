FROM python:alpine3.18

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update && apk add procps
RUN pip install --upgrade pip

# COPY . .
COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["./entrypoint.sh"]
