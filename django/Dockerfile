FROM python:3.9.18-alpine3.19

WORKDIR /usr/src/app

RUN apk update && apk add gcc g++ python3-dev

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

RUN cd app/pongbackend && python3 setup.py install

COPY ./entrypoint.sh .
CMD ["./entrypoint.sh"]