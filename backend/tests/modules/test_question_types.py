"""
Question formats: grading for every type, the student-safe view, and an attempt
with an essay that waits for the instructor.
"""
from __future__ import annotations

from app.modules.assessments.questions import score_question, student_view
from tests.modules.test_lms_store_security import _auth, env  # noqa: F401  (fixture)


def q(**fields):
    return {"id": "q", "points": 4, **fields}


def test_mcq_and_true_false():
    mcq = q(type="mcq", options=["A", "B", "C"], correctAnswer="B")
    assert score_question(mcq, "B") == 4
    assert score_question(mcq, "C") == 0
    tf = q(type="true-false", correctAnswer="True")
    assert score_question(tf, "true") == 4
    assert score_question(tf, "False") == 0


def test_multi_select_all_or_nothing_and_partial():
    base = dict(type="multi-select", options=["A", "B", "C", "D"], correctAnswers=["A", "C"])
    assert score_question(q(**base), ["A", "C"]) == 4
    assert score_question(q(**base), ["A"]) == 0
    partial = q(**base, partialCredit=True)
    assert score_question(partial, ["A"]) == 2
    # A wrong pick cancels a right one.
    assert score_question(partial, ["A", "B"]) == 0


def test_short_answer_numeric_and_fill_blank():
    short = q(type="short-answer", acceptedAnswers=["Addis Ababa", "Finfinne"])
    assert score_question(short, "  addis   ababa ") == 4
    assert score_question(short, "Adama") == 0
    numeric = q(type="numeric", numericAnswer=3.14, tolerance=0.01)
    assert score_question(numeric, "3.145") == 4
    assert score_question(numeric, "3.2") == 0
    blanks = q(type="fill-blank", stem="___ is the capital of ___.", blanks=[["Paris"], ["France"]], partialCredit=True)
    assert score_question(blanks, ["paris", "France"]) == 4
    assert score_question(blanks, ["Paris", "Spain"]) == 2


def test_matching_and_ordering():
    matching = q(type="matching", pairs=[{"left": "H2O", "right": "Water"}, {"left": "NaCl", "right": "Salt"}])
    assert score_question(matching, {"H2O": "Water", "NaCl": "Salt"}) == 4
    assert score_question(matching, {"H2O": "Salt", "NaCl": "Water"}) == 0
    ordering = q(type="ordering", orderItems=["1", "2", "3", "4"], partialCredit=True)
    assert score_question(ordering, ["1", "2", "3", "4"]) == 4
    assert score_question(ordering, ["1", "2", "4", "3"]) == 2


def test_essay_and_unkeyed_short_answer_need_the_instructor():
    assert score_question(q(type="essay"), "My answer") is None
    assert score_question(q(type="short-answer"), "anything") is None


def test_student_view_hides_answers_and_shuffles():
    matching = q(
        type="matching",
        pairs=[{"left": "a", "right": "1"}, {"left": "b", "right": "2"}, {"left": "c", "right": "3"}],
        explanation="why",
    )
    safe = student_view(matching)
    assert "pairs" not in safe and "explanation" not in safe
    assert safe["matchLeft"] == ["a", "b", "c"]
    assert sorted(safe["matchRight"]) == ["1", "2", "3"]
    ordering = student_view(q(type="ordering", orderItems=["1", "2", "3"]))
    assert "orderItems" not in ordering and ordering["orderShuffled"] != ["1", "2", "3"]
    blanks = student_view(q(type="fill-blank", stem="___ and ___", blanks=[["x"], ["y"]]))
    assert "blanks" not in blanks and blanks["blankCount"] == 2
    multi = student_view(q(type="multi-select", options=["A", "B"], correctAnswers=["A"]))
    assert "correctAnswers" not in multi and multi["options"] == ["A", "B"]


async def test_attempt_with_essay_waits_for_review(env):
    client, tenants = env
    admin = _auth(tenants["tenant-a"], "admin-1", "Admin")
    questions = [
        {"id": "q-mc", "courseId": "c1", "type": "multi-select", "options": ["A", "B", "C"],
         "correctAnswers": ["A", "B"], "points": 4},
        {"id": "q-es", "courseId": "c1", "type": "essay", "points": 6},
    ]
    for question in questions:
        await client.patch("/api/v1/data/question-bank", json={"upserts": [{"record": question, "after": None}]}, headers=admin)
    quiz = {"id": "quiz-x", "courseId": "c1", "status": "published", "questionIds": ["q-mc", "q-es"], "maxPoints": 10}
    await client.patch("/api/v1/data/quizzes", json={"upserts": [{"record": quiz, "after": None}]}, headers=admin)

    student = _auth(tenants["tenant-a"], "stu-1", "Student")
    bank = (await client.get("/api/v1/data/question-bank", headers=student)).json()["data"]
    mc = next(item for item in bank if item["id"] == "q-mc")
    assert "correctAnswers" not in mc

    res = await client.post(
        "/api/v1/assessments/quizzes/quiz-x/attempts",
        json={"answers": {"q-mc": ["A", "B"], "q-es": "An essay about algorithms."}},
        headers=student,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["score"] == 4 and body["max_score"] == 10 and body["pending_review"] == 1
    assert body["submission"]["status"] == "submitted"
    assert body["submission"]["pendingReview"] == ["q-es"]
