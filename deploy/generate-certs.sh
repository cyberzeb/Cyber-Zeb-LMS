#!/bin/bash
# Create a self-signed certificate for HTTPS on a VPS IP (no domain required).
# Prefer the complete deploy instead:
#   ./deploy/vps-docker.sh --ip YOUR_VPS_IP
#
# Usage: ./deploy/generate-certs.sh YOUR_VPS_IP

set -e

IP="${1:-}"
if [ -z "$IP" ]; then
  echo "Usage: ./deploy/generate-certs.sh YOUR_VPS_IP"
  echo "Or run the full deploy: ./deploy/vps-docker.sh --ip YOUR_VPS_IP"
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
echo "Finish with the complete deploy script:"
echo "  ./deploy/vps-docker.sh --ip $IP"
echo ""
echo "Open: https://${IP}:8443 (accept the browser security warning once)"
