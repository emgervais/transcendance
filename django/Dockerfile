FROM python:3.8.3-slim-buster

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y procps \
    netcat
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["./entrypoint.sh"]
# # CMD ["bash"]
# CMD ["tail", "-f", "/dev/null"]