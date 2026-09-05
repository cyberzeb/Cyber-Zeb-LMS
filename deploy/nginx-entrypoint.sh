#!/bin/sh
# Use HTTPS nginx config when certs are mounted; otherwise HTTP only.
set -e

if [ -f /etc/nginx/certs/cert.pem ] && [ -f /etc/nginx/certs/key.pem ]; then
  cp /etc/nginx/templates/https.conf /etc/nginx/conf.d/default.conf
  echo "nginx: HTTPS enabled (certs found)"
else
  cp /etc/nginx/templates/http.conf /etc/nginx/conf.d/default.conf
  echo "nginx: HTTP only (no certs at /etc/nginx/certs)"
fi

exec nginx -g "daemon off;"
