FROM python:3.11.7-alpine3.19

WORKDIR /usr/src/app

RUN apk update && apk add gcc g++ python3-dev

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ./entrypoint.sh .
CMD ["./entrypoint.sh"]