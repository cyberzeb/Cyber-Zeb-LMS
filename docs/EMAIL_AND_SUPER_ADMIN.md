# Email sending and Super Admin sign-in

Everything needed to run Berana LMS sign-in on **real emailed codes** before you
own a domain, using Mailpit as the mail server, and to manage the platform Super
Admin accounts that the console belongs to.

Written for: whoever sets up or runs a Berana environment (local, staging or VPS).

---

## 1. What changed, in one paragraph

Sign-in codes were only ever really emailed through Gmail, and a demo server
short-circuited every code to `000000` — including the platform Super Admin, the
account that can create, suspend and delete institutions. Now the mailer talks to
any SMTP server (Mailpit included: no login, no TLS), and the Super Admin always
gets a random code by email even while `DEMO_LOGIN_ENABLED=true`. Student,
instructor and guardian demo logins are unchanged.

---

## 2. Start Mailpit

Mailpit is a mail server that **captures** messages instead of delivering them and
shows them in a web inbox, so you can test real sign-in emails with no domain, no
DNS and no provider account.

### Option A — Docker (recommended)

Docker Desktop must be running first.

```bash
docker compose -f docker-compose.mailpit.yml up -d
```

Inbox: <http://localhost:8025> · SMTP: `localhost:1025`

Stop it with `docker compose -f docker-compose.mailpit.yml down`.

### Option B — the Mailpit binary (no Docker)

Download `mailpit-windows-amd64.zip` from
<https://github.com/axllent/mailpit/releases>, unzip it and run:

```powershell
.\mailpit.exe
```

Same ports, same inbox URL.

### Option C — on a server, inside the compose stack

**This is the one to use whenever the API itself runs in Docker.** The main
`docker-compose.yml` carries Mailpit behind a profile, so it never starts by
accident, and starting it this way puts it on the same network and project as the
API — `docker-compose.mailpit.yml` would instead report `brana_web` and
`brana_api` as orphan containers.

```bash
docker compose --profile mail up -d mailpit
```

Ports are bound to `127.0.0.1` only in both files. **Never expose 8025 publicly** —
the inbox holds every sign-in code the platform issues, including the Super
Admin's. Read it through an SSH tunnel from your own machine:

```bash
ssh -L 8025:127.0.0.1:8025 user@your-server      # then open http://localhost:8025
```

---

## 2b. Server (Docker) walkthrough

On a server there is no `.venv` and no `backend/.env`: the API runs in the `api`
container and reads the **root `.env`**. Commands that target the venv or
`npm run dev:full` are for a workstation only.

```bash
cd /path/to/Cyber-Zeb-LMS

# 1. Mailpit, on the same network as the API
docker compose --profile mail up -d mailpit

# 2. Add the email block to the ROOT .env (see .env.docker.example).
#    SMTP_HOST must be the service name, not localhost:
cat >> .env <<'EOF'
EMAIL_ENABLED=true
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_STARTTLS=false
SMTP_SSL=false
SMTP_FROM_EMAIL=no-reply@berana-lms.local
SMTP_FROM_NAME=Berana LMS
SUPER_ADMIN_OTP_REQUIRE_EMAIL=true
EOF

# 3. Pick the API up on the new settings
docker compose up -d --force-recreate api

# 4. Prove mail works — run the script INSIDE the container
docker compose exec api python -m scripts.send_test_email you@example.com

# 5. Manage super admins the same way
docker compose exec api python -m scripts.manage_super_admin list
```

`SMTP_HOST=localhost` inside the `api` container means *the container itself*, so
it always fails there. Use `mailpit`.

Because Mailpit captures everything, the super admin address does not have to be a
real mailbox — `superadmin@berana.edu` is fine, and its code shows up in the
Mailpit inbox like any other message.

---

## 3. Point the API at it

`backend/.env` (local) already has this block, and `backend/.env.example` ships it
for new checkouts:

```ini
EMAIL_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_STARTTLS=false
SMTP_SSL=false
SMTP_FROM_EMAIL=no-reply@berana-lms.local
SMTP_FROM_NAME=Berana LMS
SUPER_ADMIN_OTP_REQUIRE_EMAIL=true
```

Inside Docker use `SMTP_HOST=mailpit` instead of `localhost` — containers reach
each other by service name — and recreate the API:

```bash
docker compose up -d --force-recreate api
```

### Prove it works before touching the UI

```bash
cd backend
.venv/Scripts/python -m scripts.send_test_email you@example.com
```

It prints the resolved SMTP settings (never the password) and either the sent
message id or the exact SMTP error. Add `--sample-code` to send the real sign-in
code template instead of a plain test message.

---

## 4. Manage Super Admin accounts

Super admins live in `platform_admin_users`, deliberately separate from every
institution's users. Manage them with:

```bash
cd backend
.venv/Scripts/python -m scripts.manage_super_admin list
.venv/Scripts/python -m scripts.manage_super_admin add you@example.com
.venv/Scripts/python -m scripts.manage_super_admin set-password you@example.com
.venv/Scripts/python -m scripts.manage_super_admin suspend you@example.com
.venv/Scripts/python -m scripts.manage_super_admin unsuspend you@example.com
.venv/Scripts/python -m scripts.manage_super_admin remove you@example.com
```

`add` and `set-password` print a generated password once if you do not pass
`--password`. The script refuses to suspend or delete the last active super admin.

On a fresh database, `python -m scripts.bootstrap_onboarding` creates the schema
and seeds the account named by `PLATFORM_SUPER_ADMIN_EMAIL`.

A signed-in super admin can also invite another one from **Roles & Permissions**
in the console; the invitee gets an email and signs in with a code, never a
password.

---

## 5. Sign in as Super Admin

1. Start both halves: `npm run dev:full` (API on 8001, Vite on 5173).
2. Open <http://localhost:5173/login>.
3. Type the super admin email (`superadmin@berana.edu` by default) and press
   **Continue**. The lookup recognises it and switches the role to Super Admin.
4. Press **Send verification code**.
5. Open <http://localhost:8025>, read the 6-digit code from the newest message,
   and type it in.
6. You land on `/super-admin`. The session lasts 8 hours.

`000000` does **not** work here, and the code is never shown in the browser or in
the API response — only in the inbox.

### If the code never arrives

* Mailpit not running → the send fails and the page says so. Start Mailpit and
  press send again; the failed attempt does not trigger the 30-second cooldown.
* Check the API log for `Sign-in code email failed … via <host>:<port>` — it names
  the exact SMTP target and error.
* Fallback that needs no email: `POST /api/v1/auth/super-admin/login` with the
  email and password still returns a console token.

### When a session runs out

An expired token never shows an error screen. The console and the portals both
detect it and send the user to `/login?expired=1` with "Your session has ended.
Please sign in again." Portal sessions renew themselves silently while the refresh
token is alive (`REFRESH_TOKEN_EXPIRE_DAYS`, 30 days), so a portal user is only
asked for a new code after a month away. The Super Admin console holds no refresh
token, so it asks again after `ACCESS_TOKEN_EXPIRE_MINUTES` (8 hours).

---

## 6. Going to production

When the domain and mailbox exist, switch mail providers by editing `.env` only —
no code change.

**Gmail / Google Workspace** (simplest): set just these two and the Gmail host,
port and STARTTLS are applied automatically, overriding `SMTP_*`.

```ini
GMAIL_USER=no-reply@yourdomain.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

The app password comes from <https://myaccount.google.com/apppasswords> and needs
2-step verification on the account. Gmail rewrites the sender to this address.

**Any other provider** (SES, Postmark, Mailgun, Brevo, your own relay):

```ini
GMAIL_USER=
GMAIL_APP_PASSWORD=
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_STARTTLS=true      # port 587
# SMTP_SSL=true         # port 465 instead, with SMTP_STARTTLS=false
SMTP_FROM_EMAIL=no-reply@yourdomain.com
```

Also do these, or your mail lands in spam:

* Set `DEMO_LOGIN_ENABLED=false` so no account accepts `000000`.
* Set `SUPER_ADMIN_NOTIFY_EMAIL` to the address that should receive new service
  request alerts (it falls back to `PLATFORM_SUPER_ADMIN_EMAIL`).
* Change `PLATFORM_SUPER_ADMIN_PASSWORD` from `Demo123!`.
* Publish SPF, DKIM and DMARC records for the sending domain.
* Leave Mailpit out of the production stack, or keep it bound to `127.0.0.1`.

---

## 7. Settings reference

| Setting | Default | What it does |
|---|---|---|
| `EMAIL_ENABLED` | `true` | `false` drops every message and logs a warning |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Mail server. Mailpit by default |
| `SMTP_USER` / `SMTP_PASSWORD` | empty | Omit both for a server that needs no login |
| `SMTP_STARTTLS` | `false` | `true` for port 587 |
| `SMTP_SSL` | `false` | `true` for implicit TLS on port 465 |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | `no-reply@berana-lms.local` / `Berana LMS` | Envelope sender and display name |
| `SMTP_TIMEOUT_SECONDS` | `15` | Per-connection timeout |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | empty | Set both to force Gmail and ignore `SMTP_*` |
| `SUPER_ADMIN_OTP_REQUIRE_EMAIL` | `true` | Super admin codes are always random and emailed |
| `SUPER_ADMIN_NOTIFY_EMAIL` | empty | Service-request alerts; falls back to the platform super admin |
| `DEMO_LOGIN_ENABLED` | `false` | Tenant portals accept `000000`; never affects the console |
| `OTP_TTL_MINUTES` | `10` | How long a code stays valid |
| `OTP_MAX_ATTEMPTS` | `5` | Wrong tries before the code is thrown away |
| `OTP_RESEND_COOLDOWN_SECONDS` | `30` | Wait between resends (skipped when a send failed) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Sign-in length. Also the Super Admin console session, which has no refresh token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | How long a portal session can keep renewing itself before a new code is needed |
