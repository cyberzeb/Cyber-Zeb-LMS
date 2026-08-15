"""
Shared pytest fixtures.

Definition of Done (Blueprint Section 19.1) requires:
- Authorization tested for allowed and denied roles
- Tenant isolation tested
These fixtures make both easy to write per-module.
"""
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
