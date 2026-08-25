import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { readLessonResponses } from '../../../shared/storage/readers'
import { persistCollection } from '../../../shared/storage/persistCollection'

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
  return readLessonResponses() as ResponseStore
}

function writeStore(store: ResponseStore) {
  persistCollection(STORAGE_KEYS.lessonResponses, store)
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.lessonResponsesUpdated))
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
