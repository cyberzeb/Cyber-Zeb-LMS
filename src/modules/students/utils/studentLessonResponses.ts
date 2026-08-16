import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'

export interface LessonQuestionResponse {
  questionId: string
  /** Selected option index for multiple-choice, or text for short-answer */
  answer: string
  confirmedAt: string
  isCorrect?: boolean
}

type ResponseStore = Record<
  string,
  Record<string, Record<string, LessonQuestionResponse[]>>
>

function readStore(): ResponseStore {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.lessonResponses)
    if (stored) return JSON.parse(stored) as ResponseStore
  } catch {
    /* ignore */
  }
  return {}
}

function writeStore(store: ResponseStore) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.lessonResponses, JSON.stringify(store))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.lessonResponsesUpdated))
  } catch {
    /* ignore */
  }
}

export function getLessonResponses(
  studentId: string,
  courseId: string,
  lessonId: string,
): LessonQuestionResponse[] {
  return readStore()[studentId]?.[courseId]?.[lessonId] ?? []
}

export function getQuestionResponse(
  studentId: string,
  courseId: string,
  lessonId: string,
  questionId: string,
): LessonQuestionResponse | undefined {
  return getLessonResponses(studentId, courseId, lessonId).find((r) => r.questionId === questionId)
}

export function confirmQuestionResponse(
  studentId: string,
  courseId: string,
  lessonId: string,
  response: Omit<LessonQuestionResponse, 'confirmedAt'>,
) {
  const store = readStore()
  const lessonResponses = store[studentId]?.[courseId]?.[lessonId] ?? []
  const next: LessonQuestionResponse = { ...response, confirmedAt: new Date().toISOString() }
  const filtered = lessonResponses.filter((r) => r.questionId !== response.questionId)
  store[studentId] = {
    ...store[studentId],
    [courseId]: {
      ...store[studentId]?.[courseId],
      [lessonId]: [...filtered, next],
    },
  }
  writeStore(store)
  return next
}

export function allQuestionsConfirmed(
  studentId: string,
  courseId: string,
  lessonId: string,
  questionIds: string[],
): boolean {
  if (questionIds.length === 0) return true
  const responses = getLessonResponses(studentId, courseId, lessonId)
  return questionIds.every((id) => responses.some((r) => r.questionId === id))
}
