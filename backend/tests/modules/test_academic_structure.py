"""
University hierarchy rules: a record may never point at a parent that does not exist.

    Campus → College → Department → Program → Course → Offering → Enrollment
    Academic Year → Academic Term (an offering runs in one term)
"""
from __future__ import annotations

from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


def _admin(tenants):
    return _auth(tenants["tenant-a"], "admin-1", "Admin")


async def _patch(client, tenants, collection, record):
    return await client.patch(
        f"/api/v1/data/{collection}",
        json={"upserts": [{"record": record}]},
        headers=_admin(tenants),
    )


async def test_offering_requires_existing_course_and_term(env):
    client, tenants = env
    await _patch(client, tenants, "academic-years", {"id": "ay-1", "code": "2026"})
    await _patch(client, tenants, "academic-terms", {"id": "t-1", "name": "Fall", "academicYearId": "ay-1"})

    missing_term = await _patch(
        client, tenants, "course-offerings", {"id": "off-1", "courseId": "c1", "sectionCode": "01"}
    )
    assert missing_term.status_code == 422
    assert "Academic term" in missing_term.json()["error"]["message"]

    unknown_course = await _patch(
        client, tenants, "course-offerings",
        {"id": "off-1", "courseId": "does-not-exist", "academicTermId": "t-1"},
    )
    assert unknown_course.status_code == 422

    ok = await _patch(
        client, tenants, "course-offerings",
        {"id": "off-1", "courseId": "c1", "academicTermId": "t-1", "sectionCode": "01"},
    )
    assert ok.status_code == 200


async def test_term_requires_academic_year(env):
    client, tenants = env
    res = await _patch(client, tenants, "academic-terms", {"id": "t-x", "name": "Orphan term"})
    assert res.status_code == 422
    res = await _patch(
        client, tenants, "academic-terms", {"id": "t-x", "name": "Orphan", "academicYearId": "nope"}
    )
    assert res.status_code == 422


async def test_program_requires_department(env):
    client, tenants = env
    assert (await _patch(client, tenants, "programs", {"id": "p-1", "name": "BSc CS"})).status_code == 422
    await _patch(client, tenants, "departments", {"id": "d-1", "name": "Computer Science"})
    ok = await _patch(client, tenants, "programs", {"id": "p-1", "name": "BSc CS", "departmentId": "d-1"})
    assert ok.status_code == 200


async def test_enrollment_must_point_at_an_offering_of_the_same_course(env):
    client, tenants = env
    await _patch(client, tenants, "academic-years", {"id": "ay-1", "code": "2026"})
    await _patch(client, tenants, "academic-terms", {"id": "t-1", "name": "Fall", "academicYearId": "ay-1"})
    await _patch(
        client, tenants, "course-offerings", {"id": "off-1", "courseId": "c1", "academicTermId": "t-1"}
    )

    no_offering = await _patch(
        client, tenants, "enrollments", {"id": "e-1", "studentId": "stu-1", "courseId": "c1"}
    )
    assert no_offering.status_code == 422

    mismatch = await _patch(
        client, tenants, "enrollments",
        {"id": "e-1", "studentId": "stu-1", "courseId": "c2", "courseOfferingId": "off-1"},
    )
    assert mismatch.status_code == 422

    ok = await _patch(
        client, tenants, "enrollments",
        {"id": "e-1", "studentId": "stu-1", "courseId": "c1", "courseOfferingId": "off-1"},
    )
    assert ok.status_code == 200


async def test_department_college_and_campus_must_exist(env):
    client, tenants = env
    bad = await _patch(client, tenants, "departments", {"id": "d-2", "name": "Law", "collegeId": "ghost"})
    assert bad.status_code == 422
    ok = await _patch(client, tenants, "departments", {"id": "d-2", "name": "Law"})
    assert ok.status_code == 200


async def test_whole_collection_replace_is_validated(env):
    client, tenants = env
    res = await client.put(
        "/api/v1/data/course-offerings",
        json={"data": [{"id": "off-9", "courseId": "c1"}]},
        headers=_admin(tenants),
    )
    assert res.status_code == 422
