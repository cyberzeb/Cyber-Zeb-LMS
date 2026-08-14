"""
Example test module. Every module PR must include tests following this
shape:
1. Happy path for the allowed role
2. 403 for a disallowed role
3. 401 with no/invalid token
4. Cross-tenant access denied (Section 17.3 - Multi-Tenant Rule)

Requires a running test database - wire up a fixture that points
DATABASE_URL at a disposable test DB / schema before running for real.
"""
import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_tenant_requires_auth(client):
    response = await client.post(
        "/api/v1/tenants",
        json={"code": "aau", "name": "Addis Ababa University", "tenant_type": "university"},
    )
    assert response.status_code == 401
