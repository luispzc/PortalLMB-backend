FROM alpine:3.20

ARG PB_VERSION=0.30.0

RUN apk add --no-cache unzip ca-certificates tzdata wget

# Descargar PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip

WORKDIR /pb

# Las migraciones crean las colecciones y el catálogo inicial al arrancar
COPY ./pb_migrations /pb/pb_migrations
COPY ./pb_hooks /pb/pb_hooks
COPY ./docker-entrypoint.sh /pb/docker-entrypoint.sh
RUN chmod +x /pb/docker-entrypoint.sh

# Railway entrega el puerto en $PORT; 8080 es el valor por defecto
EXPOSE 8080

ENTRYPOINT ["/pb/docker-entrypoint.sh"]
