#!/usr/bin/env bash
# Gera .env com segredos aleatorios a partir do .env.example
set -euo pipefail
if [ -f .env ]; then echo ".env ja existe; nada feito."; exit 0; fi
cp .env.example .env
set_var() { sed -i "s|^$1=.*|$1=$2|" .env; }
set_var MYSQL_PASSWORD "$(openssl rand -hex 16)"
set_var MYSQL_ROOT_PASSWORD "$(openssl rand -hex 16)"
set_var MINIO_ROOT_PASSWORD "$(openssl rand -hex 16)"
set_var DATABASE_ENCRYPTION_KEY "$(openssl rand -hex 32)"
set_var NEXTAUTH_SECRET "$(openssl rand -hex 32)"
set_var MEDIA_SERVER_WEBHOOK_SECRET "$(openssl rand -hex 32)"
chmod 600 .env
echo "Pronto. Edite CAP_DOMAIN, S3_DOMAIN e ACME_EMAIL no .env e rode: docker compose up -d --build"
