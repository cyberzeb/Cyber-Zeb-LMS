/**
 * Question formats: labels, defaults, validation and the student view.
 * Mirrors the server rules in backend/app/modules/assessments/questions.py.
 */
import type { QuestionRecord, QuestionType, QuizAnswer } from '../../modules/institution/types/assessments'

export interface QuestionTypeInfo {
  type: QuestionType
  label: string
  description: string
  /** False when the instructor marks it by hand. */
  autoGraded: boolean
}

export const QUESTION_TYPES: QuestionTypeInfo[] = [
  { type: 'mcq', label: 'Multiple choice', description: 'One correct option', autoGraded: true },
  { type: 'multi-select', label: 'Multiple answers', description: 'Several correct options', autoGraded: true },
  { type: 'true-false', label: 'True / False', description: 'A statement to judge', autoGraded: true },
  { type: 'short-answer', label: 'Short answer', description: 'A word or phrase', autoGraded: true },
  { type: 'numeric', label: 'Numeric', description: 'A number, with tolerance', autoGraded: true },
  { type: 'fill-blank', label: 'Fill in the blanks', description: 'Words missing from a sentence', autoGraded: true },
  { type: 'matching', label: 'Matching', description: 'Pair items from two lists', autoGraded: true },
  { type: 'ordering', label: 'Ordering', description: 'Put items in sequence', autoGraded: true },
  { type: 'essay', label: 'Essay', description: 'Long answer, marked by hand', autoGraded: false },
]

export function questionTypeInfo(type: QuestionType | string): QuestionTypeInfo {
  return QUESTION_TYPES.find((t) => t.type === type) ?? QUESTION_TYPES[3]
}

export const BLANK_MARKER = '___'
const BLANK_PATTERN = /_{3,}/g

export function blankCount(stem: string): number {
  return (stem.match(BLANK_PATTERN) ?? []).length
}

/** Splits a fill-in-the-blank stem into text parts around each blank. */
export function splitBlanks(stem: string): string[] {
  return stem.split(BLANK_PATTERN)
}

export function needsManualGrading(question: Pick<QuestionRecord, 'type' | 'acceptedAnswers' | 'correctAnswer'>): boolean {
  if (question.type === 'essay') return true
  if (question.type === 'short-answer') return !(question.acceptedAnswers?.length || question.correctAnswer)
  return false
}

/** Fields a new question of this type starts with. */
export function emptyQuestionFields(type: QuestionType): Partial<QuestionRecord> {
  switch (type) {
    case 'mcq':
      return { options: ['', '', '', ''], correctAnswer: '' }
    case 'multi-select':
      return { options: ['', '', '', ''], correctAnswers: [], partialCredit: true }
    case 'true-false':
      return { correctAnswer: 'True' }
    case 'short-answer':
      return { acceptedAnswers: [''], caseSensitive: false }
    case 'numeric':
      return { numericAnswer: undefined, tolerance: 0, unit: '' }
    case 'fill-blank':
      return { blanks: [], partialCredit: true }
    case 'matching':
      return { pairs: [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }], partialCredit: true }
    case 'ordering':
      return { orderItems: ['', '', ''], partialCredit: false }
    case 'essay':
      return { wordLimit: undefined }
  }
}

/** Fields that belong to some other type, removed when a question is saved. */
const TYPE_FIELDS: (keyof QuestionRecord)[] = [
  'options',
  'correctAnswer',
  'correctAnswers',
  'acceptedAnswers',
  'caseSensitive',
  'numericAnswer',
  'tolerance',
  'unit',
  'blanks',
  'pairs',
  'orderItems',
  'wordLimit',
  'partialCredit',
]

/** Keeps only the fields the question's type uses, with empty entries trimmed. */
export function cleanQuestion<T extends Partial<QuestionRecord> & { type: QuestionType }>(draft: T): T {
  const keep = new Set(Object.keys(emptyQuestionFields(draft.type)))
  const out = { ...draft } as Record<string, unknown>
  for (const field of TYPE_FIELDS) if (!keep.has(field)) delete out[field]
  const trimList = (list?: string[]) => (list ?? []).map((v) => v.trim()).filter(Boolean)
  if (draft.options) out.options = trimList(draft.options)
  if (draft.acceptedAnswers) out.acceptedAnswers = trimList(draft.acceptedAnswers)
  if (draft.orderItems) out.orderItems = trimList(draft.orderItems)
  if (draft.pairs) out.pairs = draft.pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })).filter((p) => p.left && p.right)
  if (draft.blanks) out.blanks = draft.blanks.slice(0, blankCount(draft.stem ?? '')).map(trimList)
  return out as T
}

/** First problem with a draft question, or null when it can be saved. */
export function validateQuestion(q: Partial<QuestionRecord> & { type: QuestionType }): string | null {
  const stem = (q.stem ?? '').trim()
  if (!stem) return 'Write the question.'
  const filled = (list?: string[]) => (list ?? []).map((v) => v.trim()).filter(Boolean)
  switch (q.type) {
    case 'mcq': {
      const options = filled(q.options)
      if (options.length < 2) return 'Add at least two options.'
      if (new Set(options).size !== options.length) return 'Options must be different from each other.'
      if (!q.correctAnswer || !options.includes(q.correctAnswer.trim())) return 'Mark the correct option.'
      return null
    }
    case 'multi-select': {
      const options = filled(q.options)
      if (options.length < 2) return 'Add at least two options.'
      if (new Set(options).size !== options.length) return 'Options must be different from each other.'
      const correct = (q.correctAnswers ?? []).filter((a) => options.includes(a))
      if (correct.length === 0) return 'Mark at least one correct option.'
      return null
    }
    case 'true-false':
      return q.correctAnswer === 'True' || q.correctAnswer === 'False' ? null : 'Choose True or False.'
    case 'short-answer':
      return null // No accepted answers means the instructor marks it.
    case 'numeric':
      if (q.numericAnswer === undefined || Number.isNaN(q.numericAnswer)) return 'Enter the correct number.'
      if ((q.tolerance ?? 0) < 0) return 'Tolerance cannot be negative.'
      return null
    case 'fill-blank': {
      const count = blankCount(stem)
      if (count === 0) return `Mark each blank in the question with ${BLANK_MARKER}.`
      for (let i = 0; i < count; i += 1) {
        if (filled(q.blanks?.[i]).length === 0) return `Give the answer for blank ${i + 1}.`
      }
      return null
    }
    case 'matching': {
      const pairs = (q.pairs ?? []).filter((p) => p.left.trim() || p.right.trim())
      if (pairs.length < 2) return 'Add at least two pairs.'
      if (pairs.some((p) => !p.left.trim() || !p.right.trim())) return 'Fill both sides of every pair.'
      const rights = pairs.map((p) => p.right.trim())
      if (new Set(rights).size !== rights.length) return 'Right-hand items must be different from each other.'
      return null
    }
    case 'ordering': {
      const items = filled(q.orderItems)
      if (items.length < 2) return 'Add at least two items.'
      if (new Set(items).size !== items.length) return 'Items must be different from each other.'
      return null
    }
    case 'essay':
      return null
  }
}

function stableShuffle(items: string[], seed: string): string[] {
  const hash = (value: string) => {
    let h = 2166136261
    for (const ch of `${seed}:${value}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
    return h >>> 0
  }
  const shuffled = [...items].sort((a, b) => hash(a) - hash(b))
  if (shuffled.length > 1 && shuffled.every((v, i) => v === items[i])) shuffled.push(shuffled.shift()!)
  return shuffled
}

/** The question as a student sees it (used for the editor's preview; the server builds the real one). */
export function toStudentQuestion(q: QuestionRecord): QuestionRecord {
  const view: QuestionRecord = { ...q }
  if (q.type === 'fill-blank') view.blankCount = blankCount(q.stem)
  if (q.type === 'matching') {
    const pairs = (q.pairs ?? []).filter((p) => p.left && p.right)
    view.matchLeft = q.matchLeft ?? pairs.map((p) => p.left)
    view.matchRight = q.matchRight ?? stableShuffle(pairs.map((p) => p.right), q.id)
  }
  if (q.type === 'ordering') view.orderShuffled = q.orderShuffled ?? stableShuffle((q.orderItems ?? []).filter(Boolean), q.id)
  return view
}

export function isAnswered(q: QuestionRecord, answer: QuizAnswer | undefined): boolean {
  if (answer === undefined) return false
  if (q.type === 'multi-select' || q.type === 'ordering') return Array.isArray(answer) && answer.length > 0
  if (q.type === 'fill-blank') {
    const count = q.blankCount ?? blankCount(q.stem)
    return Array.isArray(answer) && answer.filter((a) => a.trim()).length >= count
  }
  if (q.type === 'matching') {
    const lefts = q.matchLeft ?? []
    return typeof answer === 'object' && !Array.isArray(answer) && lefts.every((l) => (answer as Record<string, string>)[l])
  }
  return typeof answer === 'string' && answer.trim().length > 0
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
