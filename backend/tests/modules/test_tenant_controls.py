"""
Super Admin institution controls: suspend, reactivate, reset admin access code.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.security import create_access_token
from app.modules.identity import otp_service
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


def _super_admin(tenants) -> dict[str, str]:
    token = create_access_token(
        subject=str(tenants["_platform_admin"]),
        extra_claims={"principal_type": "platform_admin", "role": "super_admin", "email": "root@example.com"},
    )
    return {"Authorization": f"Bearer {token}"}


async def test_suspend_blocks_tenant_and_reactivate_restores(env, monkeypatch):
    client, tenants = env
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", True)
    monkeypatch.setattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    otp_service._challenges.clear()
    tenant = tenants["tenant-a"]
    student = _auth(tenant, "stu-1", "Student")
    _, refresh = otp_service.issue_portal_tokens("stu-1", str(tenant), "Student")

    missing_reason = await client.post(
        f"/api/v1/super-admin/institutions/{tenant}/suspend", json={}, headers=_super_admin(tenants)
    )
    assert missing_reason.status_code == 422

    res = await client.post(
        f"/api/v1/super-admin/institutions/{tenant}/suspend",
        json={"reason": "Unpaid invoice"},
        headers=_super_admin(tenants),
    )
    assert res.status_code == 200 and res.json()["status"] == "suspended"

    assert (await client.get("/api/v1/data/courses", headers=student)).status_code == 403
    login = {"email": "sam@example.com", "role": "Student", "tenant_code": "tenant-a"}
    assert (await client.post("/api/v1/auth/otp/send", json=login)).status_code == 422
    assert (await client.post("/api/v1/auth/portal/refresh", json={"refresh_token": refresh})).status_code == 422

    res = await client.post(
        f"/api/v1/super-admin/institutions/{tenant}/reactivate", json={}, headers=_super_admin(tenants)
    )
    assert res.status_code == 200 and res.json()["status"] == "active"
    assert (await client.get("/api/v1/data/courses", headers=student)).status_code == 200


async def test_reset_admin_code_replaces_old_code(env, monkeypatch):
    client, tenants = env
    tenant = tenants["tenant-a"]
    monkeypatch.setattr(
        "app.modules.onboarding.service.send_email_sync",
        lambda **kw: type("R", (), {"ok": True, "body": "", "subject": "", "to_email": kw["to_email"],
                                    "error_message": None, "provider_message_id": None})(),
    )
    otp_service._admin_failures.clear()
    res = await client.post(
        f"/api/v1/super-admin/institutions/{tenant}/reset-admin-code", headers=_super_admin(tenants)
    )
    assert res.status_code == 200
    new_code = res.json()["admin_access_code"]
    assert len(new_code) == 6 and new_code.isdigit()

    login = {"email": "owner@example.com", "role": "Admin", "tenant_code": "tenant-a"}
    if new_code != "111111":
        old = await client.post("/api/v1/auth/otp/verify", json={**login, "code": "111111"})
        assert old.status_code == 422
    ok = await client.post("/api/v1/auth/otp/verify", json={**login, "code": new_code})
    assert ok.status_code == 200


async def test_tenant_controls_require_super_admin(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    admin = _auth(tenant, "admin-1", "Admin")
    for action in ("suspend", "reactivate", "reset-admin-code"):
        res = await client.post(f"/api/v1/super-admin/institutions/{tenant}/{action}", json={}, headers=admin)
        assert res.status_code in (401, 403), action


async def test_suspended_super_admin_loses_access(env):
    client, tenants = env
    headers = _super_admin(tenants)
    assert (await client.get("/api/v1/super-admin/overview", headers=headers)).status_code == 200

    from sqlalchemy import update

    from app.core.database import get_db
    from app.main import app as fastapi_app
    from app.modules.onboarding.models import PlatformAdminUser

    async for db in fastapi_app.dependency_overrides[get_db]():
        await db.execute(
            update(PlatformAdminUser).where(PlatformAdminUser.id == tenants["_platform_admin"]).values(is_suspended=True)
        )
        await db.commit()
    assert (await client.get("/api/v1/super-admin/overview", headers=headers)).status_code == 403
