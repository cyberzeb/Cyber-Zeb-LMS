"""
Question formats: grading rules and the student-safe view.

Every question in the `question-bank` collection has a `type`; the fields it
uses depend on that type. Answers arrive in the shape the student UI produces:

  type            answer key fields                      student answer
  ─────────────── ────────────────────────────────────── ─────────────────────
  mcq             options, correctAnswer (option text)   "option text"
  multi-select    options, correctAnswers [texts]        ["text", "text"]
  true-false      correctAnswer "True" | "False"         "True"
  short-answer    acceptedAnswers [texts], caseSensitive "typed text"
  numeric         numericAnswer, tolerance, unit         "3.14"
  fill-blank      stem with ___ markers, blanks [[...]]  ["word", "word"]
  matching        pairs [{left, right}]                  {left: right, ...}
  ordering        orderItems [in correct order]          ["item", "item", ...]
  essay           wordLimit (graded by the instructor)   "long text"

Multi-select, fill-blank, matching and ordering give partial credit when
`partialCredit` is true; otherwise they are all-or-nothing. Essays and short
answers without accepted answers are left for the instructor to mark.
"""
from __future__ import annotations

import hashlib
import re
from typing import Any, Optional

QUESTION_TYPES = (
    "mcq",
    "multi-select",
    "true-false",
    "short-answer",
    "numeric",
    "fill-blank",
    "matching",
    "ordering",
    "essay",
)

# Fields that reveal the answer: never sent to students.
SECRET_FIELDS = (
    "correctAnswer",
    "correctAnswers",
    "acceptedAnswers",
    "numericAnswer",
    "tolerance",
    "blanks",
    "pairs",
    "orderItems",
    "explanation",
    "answerKey",
)

BLANK_PATTERN = re.compile(r"_{3,}")


def _norm(value: Any, case_sensitive: bool = False) -> str:
    text = " ".join(str(value or "").split())
    return text if case_sensitive else text.lower()


def _stable_shuffle(items: list[str], seed: str) -> list[str]:
    """Same order for every student and every reload, but not the answer order."""
    shuffled = sorted(items, key=lambda item: hashlib.sha256(f"{seed}:{item}".encode()).hexdigest())
    if len(shuffled) > 1 and shuffled == items:
        shuffled = shuffled[1:] + shuffled[:1]
    return shuffled


def blank_count(question: dict[str, Any]) -> int:
    return len(BLANK_PATTERN.findall(str(question.get("stem") or "")))


def needs_manual_grading(question: dict[str, Any]) -> bool:
    kind = question.get("type")
    if kind == "essay":
        return True
    if kind == "short-answer":
        return not (question.get("acceptedAnswers") or question.get("correctAnswer"))
    return False


def is_answered(question: dict[str, Any], answer: Any) -> bool:
    kind = question.get("type")
    if kind in ("multi-select",):
        return isinstance(answer, list) and len(answer) > 0
    if kind in ("fill-blank",):
        return isinstance(answer, list) and any(str(a).strip() for a in answer)
    if kind == "ordering":
        return isinstance(answer, list) and len(answer) > 0
    if kind == "matching":
        return isinstance(answer, dict) and any(str(v).strip() for v in answer.values())
    return bool(str(answer or "").strip())


def _fraction(correct: int, total: int, partial: bool) -> float:
    if total <= 0:
        return 0.0
    if partial:
        return max(0.0, correct / total)
    return 1.0 if correct == total else 0.0


def score_question(question: dict[str, Any], answer: Any) -> Optional[float]:
    """
    Points earned for one answer, or None when the instructor must mark it.
    """
    points = float(question.get("points") or 0)
    kind = question.get("type") or "short-answer"
    partial = bool(question.get("partialCredit"))

    if needs_manual_grading(question):
        return None

    if kind == "mcq":
        return points if _norm(answer, True) == _norm(question.get("correctAnswer"), True) else 0.0

    if kind == "true-false":
        return points if _norm(answer) == _norm(question.get("correctAnswer")) else 0.0

    if kind == "short-answer":
        case_sensitive = bool(question.get("caseSensitive"))
        accepted = question.get("acceptedAnswers") or [question.get("correctAnswer")]
        given = _norm(answer, case_sensitive)
        return points if given and any(given == _norm(a, case_sensitive) for a in accepted if a) else 0.0

    if kind == "numeric":
        try:
            given = float(str(answer).replace(",", "").strip())
            expected = float(question.get("numericAnswer"))
        except (TypeError, ValueError):
            return 0.0
        tolerance = abs(float(question.get("tolerance") or 0))
        return points if abs(given - expected) <= tolerance + 1e-9 else 0.0

    if kind == "multi-select":
        correct = {_norm(a, True) for a in question.get("correctAnswers") or []}
        chosen = {_norm(a, True) for a in (answer if isinstance(answer, list) else [])}
        if not correct:
            return 0.0
        if not partial:
            return points if chosen == correct else 0.0
        right = len(chosen & correct)
        wrong = len(chosen - correct)
        return round(points * max(0.0, (right - wrong) / len(correct)), 2)

    if kind == "fill-blank":
        keys = question.get("blanks") or []
        given = answer if isinstance(answer, list) else []
        right = 0
        for index, accepted in enumerate(keys):
            value = _norm(given[index] if index < len(given) else "")
            options = accepted if isinstance(accepted, list) else [accepted]
            if value and any(value == _norm(option) for option in options):
                right += 1
        return round(points * _fraction(right, len(keys), partial), 2)

    if kind == "matching":
        pairs = [p for p in question.get("pairs") or [] if isinstance(p, dict)]
        given = answer if isinstance(answer, dict) else {}
        right = sum(1 for p in pairs if _norm(given.get(p.get("left")), True) == _norm(p.get("right"), True))
        return round(points * _fraction(right, len(pairs), partial), 2)

    if kind == "ordering":
        expected = [str(i) for i in question.get("orderItems") or []]
        given = [str(i) for i in (answer if isinstance(answer, list) else [])]
        right = sum(1 for index, item in enumerate(expected) if index < len(given) and given[index] == item)
        return round(points * _fraction(right, len(expected), partial), 2)

    return 0.0


def student_view(question: dict[str, Any]) -> dict[str, Any]:
    """The question as a student may see it: no answers, shuffled matching/ordering."""
    safe = {k: v for k, v in question.items() if k not in SECRET_FIELDS}
    kind = question.get("type")
    seed = str(question.get("id") or "")
    if kind == "fill-blank":
        safe["blankCount"] = blank_count(question)
    elif kind == "matching":
        pairs = [p for p in question.get("pairs") or [] if isinstance(p, dict)]
        safe["matchLeft"] = [str(p.get("left") or "") for p in pairs]
        safe["matchRight"] = _stable_shuffle([str(p.get("right") or "") for p in pairs], seed)
    elif kind == "ordering":
        safe["orderShuffled"] = _stable_shuffle([str(i) for i in question.get("orderItems") or []], seed)
    return safe
