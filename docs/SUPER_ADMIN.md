# Super Admin console — A to Z

The Super Admin console (`/super-admin`) is where Cyber-Zeb runs the Berana
platform: it turns a public registration into a live institution, and manages
every institution after that. This guide lists each step and page, what it does,
and its status. Use it as the checklist when cleaning up each step.

**Sign in:** `/login` → super admin email → 6-digit code, always random and always
emailed — the demo code `000000` never works for the console. A console session
lasts 8 hours (`ACCESS_TOKEN_EXPIRE_MINUTES`); when it runs out the console sends
you back to sign-in with "Your session has ended" rather than failing requests. Setting up mail (Mailpit locally,
Gmail or another provider in production) and managing super admin accounts:
[EMAIL_AND_SUPER_ADMIN.md](EMAIL_AND_SUPER_ADMIN.md).

Status legend: ✅ works end to end (tested in the browser) · 🟡 works with gaps · ❌ not usable yet

---

## A. Onboarding a new institution

| Step | Where | What happens | Status |
|---|---|---|---|
| 1. Institution registers | `/request` page | The institution fills in its Institution Master Data (10 groups) and picks its modules — every box ticked by default, so it removes what it does not need. Creates a service request with an `INST-000n` reference. | ✅ |
| 2. Review the request | Service Requests → request | Shows contact, edition, subdomain and email log | ✅ |
| 3. Send invoice | Request → Amount, Currency, Payment instructions → **Send Invoice** | Emails the invoice to the contact | ✅ |
| 4. Confirm payment | Request → **Confirm Payment** | Records that the institution paid (offline / bank transfer) | ✅ |
| 5. Activate | Request → **Activate & Send Link** | Creates the tenant with its edition, a starter workspace and the institution admin account. Shows a 6-digit admin access code once, and emails it. | ✅ |
| 6. Institution admin signs in | `/login` → admin email → access code | Lands in the admin layout for the edition (University / Corporate / Training) | ✅ all three editions |
| — Reject | Request → reject with a reason | Closes the request and emails the contact | ✅ |
| — Resend email | Request → resend | Re-sends the last onboarding email | ✅ |

## B. Managing institutions

| Feature | Where | Status | Notes |
|---|---|---|---|
| Institutions list | Institutions | ✅ | |
| Institution details | Institutions → institution | ✅ | Edition, link, subscription dates, modules |
| Mark renewed (+1 year) | Institution → Manage | ✅ | Added in Phase 2 |
| Send renewal reminder | Institution → Manage, or Renewals | ✅ | |
| **Reset admin access code** | Institution → Manage | ✅ | Added in Phase 2. The old code stops working; the new one is shown once and emailed. |
| **Suspend / reactivate** | Institution → Manage | ✅ | Added in Phase 2. A reason is required. Suspension blocks sign-in, session renewal and every API call for all of the institution's users. |
| Renewals due | Renewals | ✅ | Tenants whose renewal date is near |
| Expired subscriptions | automatic | ✅ | Expired tenants are blocked the same way as suspended ones |

## C. Platform configuration

| Page | Status | Notes |
|---|---|---|
| Overview | ✅ | Counts and quick actions |
| Manage Modules & Pricing | 🟡 | Works, and the selection is now enforced per institution. Prices still only drive the estimate shown on a request |
| Add-On Requests | ✅ | An institution hits a locked module in its workspace and clicks "Request this module", which lands here |
| Landing Page Content | ✅ | The announcement banner shows on the public landing page |
| Appearance & Branding | ✅ | Footer text, links, support contacts, logo/favicon upload |
| System Settings | ✅ | Platform key/value settings |
| Integrations | 🟡 | OAuth connect for Zoom / Teams / Google Meet / Webex needs each provider's client ID and secret in `.env` |

## D. People, security and records

| Page | Status | Notes |
|---|---|---|
| Roles & Permissions | ✅ | Invite another super admin (they sign in with an emailed code) |
| Security → super admin suspension | ✅ | Fixed in Phase 2: a suspended super admin is blocked immediately |
| Security → user reports and bans | ❌ | Built on a user table the portals do not use, and nothing can file a report (see Decisions) |
| Audit Logs | ✅ | Every super admin action is logged |
| Notifications | ✅ | Email delivery log (sent / failed) |
| Data Export | ✅ | CSV of service requests and tenants |

## E. Operations

| Page | Status | Notes |
|---|---|---|
| System Health | ✅ | Database, latency, email success rate and database size (SQLite and PostgreSQL) |
| Backup & Restore | ✅ | Fixed in Phase 2: works on SQLite (the Docker deployment) as well as PostgreSQL. Docker keeps backups on the data volume. |
| Analytics | ✅ | Fixed in Phase 2: it used PostgreSQL-only SQL and always failed on SQLite |

---

## Security fixes made to the console (Phase 2)

- The public password login (`POST /auth/super-admin/login`) used a well-known default
  password. It is now disabled unless `DEMO_LOGIN_ENABLED=true`.
- A suspended super admin could keep using the console. Now blocked on every request and at sign-in.
- An expired console session now returns to sign-in instead of showing errors.
- Invite emails pointed to a removed password page. They now explain code sign-in.

## Module entitlement

An institution only gets the modules it selected when registering. This is
enforced on the server, not just hidden in the interface:

* Module routers are gated — a call for a module the institution did not take
  answers `403 module_not_enabled` and names the module in `error.details`.
* `/api/v1/data/<collection>` is gated the same way, which is where the portal
  actually reads and writes. A bulk read simply omits locked collections.
* `GET /api/v1/tenants/me/modules` tells the workspace which modules are enabled,
  so the sidebar can show the rest locked with a "Request this module" action.
* Tenant & Institution Management and Identity & Access are always on, and an
  institution with no recorded selection keeps the full catalog, so nothing that
  predates module selection loses access.

## Decisions needed (product owner)

1. **Module pricing.** Institutions now choose their modules at registration and
   only those are activated, so add-on requests are reachable from the workspace.
   What remains open is pricing: module prices drive only the estimate on a
   request, not an actual per-module invoice.
2. **User reports and bans.** Either remove this part of the Security Center (tenant
   admins can already suspend their own people), or rebuild it on portal accounts
   with a "report a user" action in the portals.
3. **Product name.** The interface and logo say **"Brana LMS"**; the backend,
   emails and documents say **"Berana"**. Pick one.
