# Deploy on VPS with Docker

Build and run **on the server**. No zip uploads, no local build required.

Works on a **shared VPS** — uses a custom port (default **8085**) so it does not need 80/443.

---

## Quick start (on the VPS)

```bash
# 1. Install Docker (once)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and SSH back in

# 2. Get the code
git clone <your-repo-url> Cyber-Zeb-LMS
cd Cyber-Zeb-LMS

# 3. Configure
cp .env.docker.example .env
nano .env
# Set YOUR_VPS_IP, JWT_SECRET_KEY, HTTP_PORT=8085

# 4. Build and run
chmod +x deploy/vps-docker.sh
./deploy/vps-docker.sh
```

Or without the helper script:

```bash
docker compose up --build -d
```

**Share with stakeholders:** `http://YOUR_VPS_IP:8085`  
**Demo login password:** `Demo123!`

---

## Pick a free port

```bash
ss -tlnp | grep LISTEN
```

Set `HTTP_PORT` in `.env` to something free (e.g. `8085`, `8090`). Open it in the firewall:

```bash
sudo ufw allow 8085/tcp
```

Update `PUBLIC_URL` and `CORS_ORIGINS` to include the same port:

```env
HTTP_PORT=8085
PUBLIC_URL=http://203.0.113.10:8085
CORS_ORIGINS=["http://203.0.113.10:8085"]
```

---

## What runs in Docker

| Container | Role |
|-----------|------|
| **web** | Frontend + nginx (proxies `/api` to backend) |
| **api** | FastAPI + **SQLite** database (no Postgres/Redis) |

Only **2 containers**. Demo data is seeded automatically on first start.

Need Postgres instead? Use `docker compose -f docker-compose.postgres.yml up --build -d`.

---

## Useful commands

```bash
docker compose ps              # status
docker compose logs -f web api # logs
docker compose up --build -d   # rebuild after git pull
docker compose down            # stop
docker compose down -v         # stop + wipe database
```

---

## Get code onto the VPS without git

If the repo is not on GitHub yet, one-time upload from your PC:

```powershell
# From project folder - creates one zip
deploy\build-and-pack.cmd
```

Upload `deploy\berana-release.zip` with WinSCP, then on the VPS:

```bash
unzip berana-release.zip -d Cyber-Zeb-LMS
cd Cyber-Zeb-LMS
./deploy/vps-docker.sh
```

---

## No-Docker fallback

See `deploy/run_demo.py` and `deploy/install-vps.sh` if you ever need a lightweight Python-only deploy without Docker.
