#!/bin/sh
set -eu

DATA_DIR=/pb/pb_data
mkdir -p "$DATA_DIR"

# Superusuario del panel /_/ a partir de variables de entorno.
# "upsert" lo crea la primera vez y, en cada arranque, deja la contraseña igual a la variable.
if [ -n "${PB_SUPERUSER_EMAIL:-}" ] && [ -n "${PB_SUPERUSER_PASSWORD:-}" ]; then
  /pb/pocketbase superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD" --dir="$DATA_DIR"
fi

exec /pb/pocketbase serve --http="0.0.0.0:${PORT:-8080}" --dir="$DATA_DIR"
