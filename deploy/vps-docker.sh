#!/bin/bash
# Run on the VPS after cloning the repo. Builds and starts everything with Docker.
#
#   git clone <your-repo-url> Cyber-Zeb-LMS
#   cd Cyber-Zeb-LMS
#   chmod +x deploy/vps-docker.sh
#   ./deploy/vps-docker.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi
  echo "Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  echo ""
  echo "Docker installed. Log out and SSH back in, then run:"
  echo "  ./deploy/vps-docker.sh"
  exit 0
}

install_docker

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose plugin missing."
  echo "Try: sudo apt install docker-compose-plugin"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.docker.example .env
  echo ""
  echo "Created .env - edit it first:"
  echo "  nano .env"
  echo ""
  echo "Set YOUR_VPS_IP, POSTGRES_PASSWORD, JWT_SECRET_KEY, and HTTP_PORT (e.g. 8085)"
  echo "Then run: ./deploy/vps-docker.sh"
  exit 0
fi

# shellcheck disable=SC1091
source .env
PORT="${HTTP_PORT:-8085}"

echo "Building and starting (first run takes a few minutes)..."
docker compose up --build -d

echo ""
docker compose ps
echo ""
echo "Demo URL:  http://YOUR_VPS_IP:${PORT}"
echo "API docs:  http://YOUR_VPS_IP:${PORT}/docs"
echo "Demo password for seeded users: Demo123!"
echo ""
echo "Logs:  docker compose logs -f"
echo "Stop:  docker compose down"
