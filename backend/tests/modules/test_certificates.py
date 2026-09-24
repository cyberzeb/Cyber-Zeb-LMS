"""
Certificate templates and public verification.

Templates are designs every member needs in order to render their own
certificates, but only admins may change them. Verification is public so an
employer can scan the QR code without an account, and must never reveal a
certificate that has not been awarded.
"""
from __future__ import annotations

from app.modules.lms_store.models import LmsCollection
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)

TEMPLATE = {"id": "tpl-custom", "name": "Our design", "orientation": "landscape"}


async def _put(session_factory, tenant_id, key: str, data) -> None:
    async with session_factory() as db:
        db.add(LmsCollection(tenant_id=tenant_id, collection_key=key, data=data))
        await db.commit()


async def test_students_can_read_templates_but_not_change_them(env):
    client, tenants = env
    tenant = tenants["tenant-a"]
    admin = _auth(tenant, "admin-1", "Admin")
    student = _auth(tenant, "stu-1", "Student")

    saved = await client.patch(
        "/api/v1/data/certificate-templates",
        json={"upserts": [{"record": TEMPLATE}]},
        headers=admin,
    )
    assert saved.status_code == 200

    read = await client.get("/api/v1/data/certificate-templates", headers=student)
    assert read.status_code == 200
    assert read.json()["data"] == [TEMPLATE]

    edited = {**TEMPLATE, "name": "Hijacked"}
    denied = await client.patch(
        "/api/v1/data/certificate-templates",
        json={"upserts": [{"record": edited}]},
        headers=student,
    )
    assert denied.status_code == 403


async def test_verification_reports_issued_revoked_and_unknown(env):
    client, tenants = env
    await _put(
        tenants["_session_factory"],
        tenants["tenant-a"],
        "certificates",
        [
            {
                "certificateId": "BER-CERT-2026-00001",
                "studentName": "Selam Girma",
                "courseCode": "CS-101",
                "courseTitle": "Intro",
                "issueDate": "2026-01-10",
                "status": "issued",
            },
            {"certificateId": "BER-CERT-2026-00002", "studentName": "X", "status": "revoked", "revokedAt": "2026-02-01"},
            {"certificateId": "BER-CERT-2026-00003", "studentName": "Y", "status": "pending"},
            {
                "certificateId": "BER-CERT-2026-00004",
                "studentName": "Z",
                "status": "issued",
                "expirationDate": "2020-01-01",
            },
        ],
    )

    issued = (await client.get("/api/v1/public/certificates/ber-cert-2026-00001")).json()
    assert issued["found"] and issued["valid"]
    assert issued["student_name"] == "Selam Girma"
    # The institution's own display name (settings) wins over the tenant code.
    assert issued["institution_name"] == "A"

    revoked = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00002")).json()
    assert revoked["found"] and not revoked["valid"] and revoked["status"] == "revoked"

    # Not awarded yet: indistinguishable from an unknown id.
    pending = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00003")).json()
    assert pending == {**pending, "found": False, "student_name": None}

    expired = (await client.get("/api/v1/public/certificates/BER-CERT-2026-00004")).json()
    assert expired["found"] and expired["expired"] and not expired["valid"]

    unknown = (await client.get("/api/v1/public/certificates/NOPE-123")).json()
    assert unknown["found"] is False
