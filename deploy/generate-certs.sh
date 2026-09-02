#!/bin/bash
# Create a self-signed certificate for HTTPS on a VPS IP (no domain required).
# Browsers will show a warning — stakeholders click Advanced → Proceed.
#
# Usage: ./deploy/generate-certs.sh YOUR_VPS_IP
# Example: ./deploy/generate-certs.sh 203.0.113.10

set -e

IP="${1:-}"
if [ -z "$IP" ]; then
  echo "Usage: ./deploy/generate-certs.sh YOUR_VPS_IP"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT/deploy/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -subj "/CN=$IP" \
  -addext "subjectAltName=IP:$IP"

chmod 644 "$CERT_DIR/cert.pem"
chmod 600 "$CERT_DIR/key.pem"

echo ""
echo "Created:"
echo "  $CERT_DIR/cert.pem"
echo "  $CERT_DIR/key.pem"
echo ""
echo "Update .env:"
echo "  USE_HTTPS=true"
echo "  HTTPS_PORT=8443"
echo "  PUBLIC_URL=https://${IP}:8443"
echo "  CORS_ORIGINS=[\"https://${IP}:8443\"]"
echo ""
echo "Then: docker compose up --build -d"
echo "Open: https://${IP}:8443 (accept browser security warning once)"
