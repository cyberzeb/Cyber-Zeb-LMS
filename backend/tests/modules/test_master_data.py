"""
Institution Master Data on registration (Master_Data.pdf).

Covers the guide's development notes: the required minimum set is enforced, the
institution reference is system-generated and unique, the submitted document is
stored and returned to the console, and the module selection is honoured instead
of every institution silently receiving the full catalog.
"""
from __future__ import annotations

import uuid

import pytest

from app.modules.onboarding.constants import ALWAYS_ON_MODULES, ModuleKey
from tests.modules.test_onboarding import (  # noqa: F401  (fixtures)
    _auth,
    client,
    db_engine,
    db_session,
    super_admin,
)


def _master_data(**overrides) -> dict:
    """A complete, valid master data document from the guide's sample record."""
    data = {
        "identity": {
            "institution_code": "DTI",
            "short_name": "DTI",
            "ownership_type": "private",
            "registration_number": "EDU-2026-001",
            "year_established": 2015,
        },
        "contact": {
            "main_phone": "+1 703-555-0100",
            "official_email": "info@demo.edu",
            "website": "www.demo.edu",
            "registrar_email": "registrar@demo.edu",
        },
        "address": {
            "country": "United States",
            "state_region": "Virginia",
            "city": "Arlington",
            "street": "1000 Example Avenue",
            "postal_code": "22201",
        },
        "primary_contact": {
            "full_name": "Dr. Sara Example",
            "job_title": "Director of Academic Services",
            "department": "Academic Affairs",
            "email": "sara.example@demo.edu",
            "phone": "+1 703-555-0120",
        },
        "leadership": {"president": "Dr. Michael Example", "registrar": "M. Lee"},
        "academic_structure": {
            "campus_count": 2,
            "colleges": ["School of Computing", "School of Business"],
        },
        "academic_calendar": {
            "current_academic_year": "2026/27",
            "start_date": "2026-09-01",
            "end_date": "2027-05-28",
            "term_structure": "semester",
            "term_count": 2,
        },
        "certification": {
            "certificate_types": ["Completion Certificate"],
            "signatory_title": "President/Registrar",
            "numbering_format": "DTI-CERT-YYYY-#####",
            "has_institutional_seal": True,
        },
        "lms_administrator": {
            "full_name": "Daniel Example",
            "job_title": "LMS Administrator",
            "department": "IT Services",
            "email": "lmsadmin@demo.edu",
            "phone": "+1 703-555-0140",
        },
        "subscription": {
            "package": "Berana Professional",
            "license_type": "SaaS Annual",
            "contracted_users": 5000,
            "billing_cycle": "annual",
        },
    }
    data.update(overrides)
    return data


def _request_body(**overrides) -> dict:
    body = {
        "institution_name": "Demo Technology Institute",
        "institution_type": "college_university",
        "contact_name": "Dr. Sara Example",
        "email": "sara.example@demo.edu",
        "phone": "+1 703-555-0120",
        "estimated_users": "5000",
        "preferred_slug": "dti",
        "requested_modules": [
            ModuleKey.ATTENDANCE.value,
            ModuleKey.COURSE_CATALOG_AUTHORING.value,
        ],
        "master_data": _master_data(),
    }
    body.update(overrides)
    return body


async def _post(client, body):
    return await client.post(
        "/api/v1/service-requests",
        json=body,
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )


@pytest.mark.asyncio
async def test_master_data_is_stored_and_returned(client):
    res = await _post(client, _request_body())
    assert res.status_code in (200, 201), res.text
    body = res.json()

    stored = body["master_data"]
    assert stored["identity"]["registration_number"] == "EDU-2026-001"
    assert stored["address"]["country"] == "United States"
    assert stored["lms_administrator"]["email"] == "lmsadmin@demo.edu"
    # Defaulted by the schema, not sent by the client.
    assert stored["lms_administrator"]["administrator_role"] == "Institution Admin"


@pytest.mark.asyncio
async def test_institution_ref_is_generated_and_unique(client):
    first = (await _post(client, _request_body())).json()
    second = (await _post(client, _request_body(preferred_slug="dti-2"))).json()

    assert first["institution_ref"] == "INST-0001"
    assert second["institution_ref"] == "INST-0002"
    assert first["institution_ref"] != second["institution_ref"]


@pytest.mark.asyncio
async def test_institution_ref_ignores_anything_the_form_sends(client):
    """It is system-generated: a client-supplied value must not be honoured."""
    res = await _post(client, _request_body(institution_ref="INST-9999"))
    # Unknown top-level fields are ignored rather than accepted.
    assert res.status_code in (200, 201), res.text
    assert res.json()["institution_ref"] == "INST-0001"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "section,field",
    [
        ("address", "country"),
        ("contact", "official_email"),
    ],
)
async def test_required_minimum_is_enforced(client, section, field):
    data = _master_data()
    data[section].pop(field)
    res = await _post(client, _request_body(master_data=data))
    assert res.status_code == 422, res.text


@pytest.mark.asyncio
async def test_lms_administrator_is_required(client):
    data = _master_data()
    data.pop("lms_administrator")
    assert (await _post(client, _request_body(master_data=data))).status_code == 422


@pytest.mark.asyncio
async def test_primary_contact_name_and_email_are_required(client):
    data = _master_data()
    data["primary_contact"] = {"job_title": "Director"}
    assert (await _post(client, _request_body(master_data=data))).status_code == 422


@pytest.mark.asyncio
async def test_calendar_end_date_cannot_precede_start(client):
    data = _master_data()
    data["academic_calendar"]["end_date"] = "2026-01-01"
    assert (await _post(client, _request_body(master_data=data))).status_code == 422


@pytest.mark.asyncio
async def test_only_the_selected_modules_are_requested(client):
    """The whole point: an institution no longer silently receives every module."""
    body = (await _post(client, _request_body())).json()
    requested = set(body["requested_modules"])

    assert ModuleKey.ATTENDANCE.value in requested
    assert ModuleKey.COURSE_CATALOG_AUTHORING.value in requested
    assert ModuleKey.PAYMENTS_BILLING.value not in requested
    assert ModuleKey.AI_SERVICES.value not in requested
    # Core modules are merged in whatever the form sent.
    for core in ALWAYS_ON_MODULES:
        assert core.value in requested


@pytest.mark.asyncio
async def test_omitting_modules_still_means_the_whole_catalog(client):
    """Backwards compatibility for any client that predates the module picker."""
    body = _request_body()
    body.pop("requested_modules")
    requested = set((await _post(client, body)).json()["requested_modules"])
    assert requested == {m.value for m in ModuleKey}


@pytest.mark.asyncio
async def test_a_short_enquiry_without_master_data_still_works(client):
    body = _request_body()
    body.pop("master_data")
    res = await _post(client, body)
    assert res.status_code in (200, 201), res.text
    assert res.json()["master_data"] is None
