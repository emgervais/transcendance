FROM nginx:latest
RUN apt-get update && apt-get install -y procps \
    openssl
RUN mkdir /etc/nginx/ssl
RUN mkdir -p /home/app/static
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=CA/ST=QC/L=Quebec/O=42 School/OU=transcende/CN=transcende"
