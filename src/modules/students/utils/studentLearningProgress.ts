import type { CourseRecord } from '../../institution/types'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { readEnrollments } from '../../../shared/storage/readers'

/** studentId → courseId → completed lesson ids */
type LessonProgressStore = Record<string, Record<string, string[]>>

function readProgressStore(): LessonProgressStore {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.lessonProgress)
    if (stored) return JSON.parse(stored) as LessonProgressStore
  } catch {
    /* ignore */
  }
  return {}
}

function writeProgressStore(store: LessonProgressStore) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.lessonProgress, JSON.stringify(store))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.lessonProgressUpdated))
  } catch {
    /* ignore */
  }
}

export function listCourseLessonIds(course: CourseRecord): string[] {
  return (course.modules ?? []).flatMap((mod) => mod.lessons.map((lesson) => lesson.id))
}

export function getCompletedLessonIds(studentId: string, courseId: string): string[] {
  return readProgressStore()[studentId]?.[courseId] ?? []
}

export function computeLessonProgressPercent(
  course: CourseRecord,
  completedLessonIds: string[],
): number {
  const lessonIds = listCourseLessonIds(course)
  if (lessonIds.length === 0) return 0
  const completed = lessonIds.filter((id) => completedLessonIds.includes(id)).length
  return Math.round((completed / lessonIds.length) * 100)
}

export function getEnrollmentProgressPercent(
  studentId: string,
  course: CourseRecord,
): number {
  const completed = getCompletedLessonIds(studentId, course.id)
  return computeLessonProgressPercent(course, completed)
}

function syncEnrollmentProgress(studentId: string, courseId: string, progress: number) {
  try {
    const enrollments = readEnrollments()
    const next = enrollments.map((e) =>
      e.studentId === studentId && e.courseId === courseId ? { ...e, progress } : e,
    )
    window.localStorage.setItem(STORAGE_KEYS.enrollments, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.enrollmentsUpdated))
  } catch {
    /* ignore */
  }
}

export function markLessonComplete(studentId: string, course: CourseRecord, lessonId: string) {
  const store = readProgressStore()
  const courseProgress = store[studentId]?.[course.id] ?? []
  if (courseProgress.includes(lessonId)) return getEnrollmentProgressPercent(studentId, course)

  const nextCourseProgress = [...courseProgress, lessonId]
  store[studentId] = { ...store[studentId], [course.id]: nextCourseProgress }
  writeProgressStore(store)

  const percent = computeLessonProgressPercent(course, nextCourseProgress)
  syncEnrollmentProgress(studentId, course.id, percent)
  return percent
}

export function isLessonComplete(studentId: string, courseId: string, lessonId: string): boolean {
  return getCompletedLessonIds(studentId, courseId).includes(lessonId)
}

export function findNextLessonId(course: CourseRecord, completedLessonIds: string[]): string | null {
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons) {
      if (!completedLessonIds.includes(lesson.id)) return lesson.id
    }
  }
  return null
}

export function findNextLessonAfter(course: CourseRecord, currentLessonId: string): string | null {
  const ids = listCourseLessonIds(course)
  const idx = ids.indexOf(currentLessonId)
  if (idx === -1 || idx >= ids.length - 1) return null
  return ids[idx + 1] ?? null
}

export function findPrevLessonBefore(course: CourseRecord, currentLessonId: string): string | null {
  const ids = listCourseLessonIds(course)
  const idx = ids.indexOf(currentLessonId)
  if (idx <= 0) return null
  return ids[idx - 1] ?? null
}

export function getFirstLessonId(course: CourseRecord): string | null {
  return listCourseLessonIds(course)[0] ?? null
}

export function findLesson(course: CourseRecord, lessonId: string) {
  for (const mod of course.modules ?? []) {
    const lesson = mod.lessons.find((l) => l.id === lessonId)
    if (lesson) return { module: mod, lesson }
  }
  return null
}
