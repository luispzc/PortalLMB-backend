FROM alpine:latest

ARG PB_VERSION=0.30.0

RUN apk add --no-cache unzip ca-certificates tzdata wget

# Descargar PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip

# Las migraciones crean las colecciones y el catálogo inicial al arrancar
COPY ./pb_migrations /pb/pb_migrations
COPY ./pb_hooks /pb/pb_hooks

# Puerto estándar que espera Railway
EXPOSE 8080

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
