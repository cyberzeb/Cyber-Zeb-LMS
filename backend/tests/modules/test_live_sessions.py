"""
Zoom live-session endpoints: who may start a class, and what reaches Zoom.
"""
from __future__ import annotations

from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


async def test_only_hosts_get_a_start_link(env):
    client, tenants = env
    student = _auth(tenants["tenant-a"], "stu-1", "Student")
    res = await client.get("/api/v1/live-sessions/zoom/meetings/123456789/start-url", headers=student)
    assert res.status_code == 403


async def test_meeting_id_must_be_numeric(env):
    client, tenants = env
    instructor = _auth(tenants["tenant-a"], "ins-1", "Instructor")
    # A crafted id must never be spliced into the Zoom API path.
    for bad in ("..%2Fusers", "abc", "12"):
        for url in (
            f"/api/v1/live-sessions/zoom/meetings/{bad}",
            f"/api/v1/live-sessions/zoom/meetings/{bad}/start-url",
        ):
            res = await client.get(url, headers=instructor)
            assert res.status_code in (404, 422), (url, res.status_code)
        res = await client.post(f"/api/v1/live-sessions/zoom/meetings/{bad}/end", headers=instructor)
        assert res.status_code in (404, 422), (bad, res.status_code)
