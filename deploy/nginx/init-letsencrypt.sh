#!/usr/bin/env bash
# One-time bootstrap: obtains the first Let's Encrypt certificates for
# GATEWAY_DOMAIN and MARKETING_DOMAIN so the nginx service can start with
# `ssl_certificate` directives that actually resolve. Renewals afterwards are
# handled automatically by the `certbot` service in docker-compose.prod.yml.
#
# Run from the repo root on the production host, after `.env.production`
# exists there:
#   ./deploy/nginx/init-letsencrypt.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.production.example to $ENV_FILE and fill it in first." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

GATEWAY_DOMAIN="${GATEWAY_DOMAIN:?GATEWAY_DOMAIN must be set in $ENV_FILE}"
MARKETING_DOMAIN="${MARKETING_DOMAIN:?MARKETING_DOMAIN must be set in $ENV_FILE}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL must be set in $ENV_FILE}"
STAGING="${LETSENCRYPT_STAGING:-0}"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

echo "### Creating dummy self-signed certificates so nginx can start ..."
for domain in "$GATEWAY_DOMAIN" "$MARKETING_DOMAIN"; do
  compose run --rm --entrypoint "sh -c \"\
    mkdir -p /etc/letsencrypt/live/$domain && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$domain/privkey.pem \
      -out /etc/letsencrypt/live/$domain/fullchain.pem \
      -subj '/CN=$domain'\"" certbot
done

echo "### Starting nginx ..."
compose up -d nginx

echo "### Deleting dummy certificates ..."
for domain in "$GATEWAY_DOMAIN" "$MARKETING_DOMAIN"; do
  compose run --rm --entrypoint "sh -c \"rm -rf /etc/letsencrypt/live/$domain /etc/letsencrypt/archive/$domain /etc/letsencrypt/renewal/$domain.conf\"" certbot
done

echo "### Requesting real Let's Encrypt certificates ..."
staging_arg=""
if [ "$STAGING" != "0" ]; then
  staging_arg="--staging"
  echo "(using Let's Encrypt staging environment)"
fi

for domain in "$GATEWAY_DOMAIN" "$MARKETING_DOMAIN"; do
  compose run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    $staging_arg \
    --email "$LETSENCRYPT_EMAIL" \
    -d "$domain" \
    --rsa-key-size 2048 \
    --agree-tos \
    --non-interactive \
    --force-renewal
done

echo "### Reloading nginx ..."
compose exec nginx nginx -s reload

echo "### Starting the remaining stack ..."
compose up -d

echo "Done. $GATEWAY_DOMAIN and $MARKETING_DOMAIN are now serving over HTTPS."
