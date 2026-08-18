import { useCallback } from 'react'
import { useLocalStorageState, createId } from './useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../storage/keys'
import type {
  AnnouncementAuthorRole,
  AnnouncementFormInput,
  AnnouncementRecord,
  AnnouncementTargetRole,
} from '../types/announcements'
import { readCourses, readPeople } from '../storage/readers'

function notifyAnnouncementsUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.announcementsUpdated))
}

function resolveCourseMeta(courseId?: string) {
  if (!courseId) return { courseCode: undefined, courseTitle: undefined }
  const course = readCourses().find((item) => item.id === courseId)
  return { courseCode: course?.code, courseTitle: course?.title }
}

function resolveTargetNames(ids: string[]) {
  const people = readPeople()
  return ids
    .map((id) => people.find((person) => person.id === id)?.name)
    .filter((name): name is string => Boolean(name))
}

function buildTargetingFields(
  input: AnnouncementFormInput,
  authorRole: AnnouncementAuthorRole,
) {
  if (authorRole === 'instructor') {
    if (input.instructorAudience === 'selected_students') {
      const targetPersonIds = input.targetPersonIds
      return {
        targetRoles: [] as AnnouncementTargetRole[],
        instructorAudience: 'selected_students' as const,
        courseId: undefined,
        courseCode: undefined,
        courseTitle: undefined,
        targetPersonIds,
        targetPersonNames: targetPersonIds.length > 0 ? resolveTargetNames(targetPersonIds) : undefined,
      }
    }

    if (input.instructorAudience === 'course') {
      const { courseCode, courseTitle } = resolveCourseMeta(input.courseId)
      return {
        targetRoles: [] as AnnouncementTargetRole[],
        instructorAudience: 'course' as const,
        courseId: input.courseId,
        courseCode,
        courseTitle,
        targetPersonIds: undefined,
        targetPersonNames: undefined,
      }
    }

    return {
      targetRoles: [] as AnnouncementTargetRole[],
      instructorAudience: 'all_my_students' as const,
      courseId: undefined,
      courseCode: undefined,
      courseTitle: undefined,
      targetPersonIds: undefined,
      targetPersonNames: undefined,
    }
  }

  const courseId = input.courseEnabled ? input.courseId : undefined
  const { courseCode, courseTitle } = resolveCourseMeta(courseId)
  const targetPersonIds = input.specificStudentsEnabled ? input.targetPersonIds : []
  const targetPersonNames =
    targetPersonIds.length > 0 ? resolveTargetNames(targetPersonIds) : undefined

  return {
    targetRoles: input.targetRoles,
    instructorAudience: undefined,
    courseId,
    courseCode,
    courseTitle,
    targetPersonIds: targetPersonIds.length > 0 ? targetPersonIds : undefined,
    targetPersonNames,
  }
}

export function useAnnouncements() {
  const [announcements, setAnnouncementsRaw] = useLocalStorageState<AnnouncementRecord[]>(
    STORAGE_KEYS.announcements,
    [],
  )

  const setAnnouncements = useCallback(
    (updater: AnnouncementRecord[] | ((prev: AnnouncementRecord[]) => AnnouncementRecord[])) => {
      setAnnouncementsRaw(updater)
      notifyAnnouncementsUpdated()
    },
    [setAnnouncementsRaw],
  )

  const createAnnouncement = useCallback(
    (
      input: AnnouncementFormInput,
      meta: { authorId: string; authorName: string; authorRole: AnnouncementAuthorRole },
    ) => {
      const now = new Date().toISOString()

      const record: AnnouncementRecord = {
        id: createId('ann'),
        title: input.title.trim(),
        body: input.body.trim(),
        authorId: meta.authorId,
        authorName: meta.authorName,
        authorRole: meta.authorRole,
        priority: input.priority,
        postedAt: now,
        createdAt: now,
        views: 0,
        viewedBy: [],
        ...buildTargetingFields(input, meta.authorRole),
      }

      setAnnouncements((prev) => [record, ...prev])
      return record
    },
    [setAnnouncements],
  )

  const updateAnnouncement = useCallback(
    (id: string, input: AnnouncementFormInput) => {
      setAnnouncements((prev) =>
        prev.map((record) => {
          if (record.id !== id) return record

          return {
            ...record,
            title: input.title.trim(),
            body: input.body.trim(),
            priority: input.priority,
            ...buildTargetingFields(input, record.authorRole),
          }
        }),
      )
    },
    [setAnnouncements],
  )

  const deleteAnnouncement = useCallback(
    (id: string) => {
      setAnnouncements((prev) => prev.filter((record) => record.id !== id))
    },
    [setAnnouncements],
  )

  const recordView = useCallback(
    (announcementId: string, viewerId: string) => {
      setAnnouncementsRaw((prev) => {
        let changed = false
        const next = prev.map((record) => {
          if (record.id !== announcementId || record.viewedBy.includes(viewerId)) return record
          changed = true
          return {
            ...record,
            views: record.views + 1,
            viewedBy: [...record.viewedBy, viewerId],
          }
        })
        if (changed) {
          queueMicrotask(() => notifyAnnouncementsUpdated())
          return next
        }
        return prev
      })
    },
    [setAnnouncementsRaw],
  )

  return {
    announcements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    recordView,
  }
}
