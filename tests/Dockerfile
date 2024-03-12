FROM python:3.9.18-alpine3.19

WORKDIR /usr/src/tests

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
# CMD ["./main.py"]
CMD ["tail", "-f", "/dev/null"]