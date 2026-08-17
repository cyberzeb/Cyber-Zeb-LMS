import type { AnnouncementRecord, AnnouncementTargetRole, InstructorAnnouncementAudience } from '../types/announcements'
import {
  ALL_ANNOUNCEMENT_TARGET_ROLES,
  ANNOUNCEMENT_TARGET_ROLE_LABELS,
} from '../types/announcements'
import { isStudentOfInstructor } from './instructorAnnouncementUtils'
import type { AnnouncementItem as StudentAnnouncementItem } from '../../modules/students/types'
import type { AnnouncementItem as InstructorAnnouncementItem } from '../../modules/instructors/types'
import type { AnnouncementItem as AdminAnnouncementItem } from '../../modules/institution/types'

function audienceToTargetRoles(audience?: string): AnnouncementTargetRole[] {
  switch (audience) {
    case 'all':
      return [...ALL_ANNOUNCEMENT_TARGET_ROLES]
    case 'students':
      return ['Student']
    case 'instructors':
      return ['Instructor']
    case 'staff':
      return ['Staff']
    case 'admins':
      return ['Admin']
    case 'guardians':
      return ['Guardian']
    case 'students_and_instructors':
      return ['Student', 'Instructor']
    default:
      return []
  }
}

export function normalizeAnnouncementRecord(record: AnnouncementRecord): AnnouncementRecord {
  const viewedBy = record.viewedBy ?? []
  let normalized: AnnouncementRecord = { ...record, viewedBy }

  if (!record.targetRoles?.length && record.audience) {
    normalized = {
      ...normalized,
      targetRoles: audienceToTargetRoles(record.audience),
    }
  } else {
    normalized = {
      ...normalized,
      targetRoles: record.targetRoles ?? [],
    }
  }

  if (
    record.authorRole === 'instructor' &&
    !record.instructorAudience &&
    record.courseId
  ) {
    normalized.instructorAudience = 'course'
  }

  return normalized
}

export function formatAnnouncementDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatAnnouncementAudience(record: AnnouncementRecord): string {
  const normalized = normalizeAnnouncementRecord(record)

  if (normalized.authorRole === 'instructor') {
    if (normalized.instructorAudience === 'all_my_students') return 'All my students'
    if (normalized.instructorAudience === 'selected_students') {
      const count = normalized.targetPersonIds?.length ?? 0
      if (count === 1 && normalized.targetPersonNames?.[0]) return normalized.targetPersonNames[0]
      return count > 0 ? `${count} selected students` : 'Selected students'
    }
    if (normalized.instructorAudience === 'course' && normalized.courseCode) {
      return `${normalized.courseCode} students`
    }
    if (normalized.courseCode) return `${normalized.courseCode} (course)`
  }

  const parts: string[] = normalized.targetRoles.map((role) => ANNOUNCEMENT_TARGET_ROLE_LABELS[role])

  if (normalized.courseId && normalized.courseCode) {
    parts.push(`${normalized.courseCode} (course)`)
  }

  const specificCount = normalized.targetPersonIds?.length ?? 0
  if (specificCount === 1 && normalized.targetPersonNames?.[0]) {
    parts.push(normalized.targetPersonNames[0])
  } else if (specificCount > 1) {
    parts.push(`${specificCount} specific students`)
  } else if (specificCount === 1) {
    parts.push('1 specific student')
  }

  return parts.length > 0 ? parts.join(', ') : 'No audience selected'
}

export function isAnnouncementVisibleToStudent(
  record: AnnouncementRecord,
  studentId: string,
  enrolledCourseIds: string[],
): boolean {
  const normalized = normalizeAnnouncementRecord(record)

  if (normalized.authorRole === 'instructor') {
    if (normalized.instructorAudience === 'all_my_students') {
      return isStudentOfInstructor(studentId, normalized.authorId, normalized.authorName)
    }
    if (normalized.instructorAudience === 'selected_students') {
      return normalized.targetPersonIds?.includes(studentId) ?? false
    }
    if (normalized.instructorAudience === 'course' && normalized.courseId) {
      return enrolledCourseIds.includes(normalized.courseId)
    }
    if (normalized.courseId) {
      return enrolledCourseIds.includes(normalized.courseId)
    }
    return false
  }

  if (normalized.targetRoles.includes('Student')) return true
  if (normalized.targetPersonIds?.includes(studentId)) return true
  if (normalized.courseId && enrolledCourseIds.includes(normalized.courseId)) return true

  return false
}

export function isAnnouncementVisibleToInstructor(
  record: AnnouncementRecord,
  instructorId: string,
  teachingCourseIds: string[],
): boolean {
  if (record.authorId === instructorId) return true

  const normalized = normalizeAnnouncementRecord(record)
  if (normalized.targetRoles.includes('Instructor')) return true
  if (normalized.courseId && teachingCourseIds.includes(normalized.courseId)) return true

  return false
}

function sortNewestFirst(records: AnnouncementRecord[]): AnnouncementRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function filterAnnouncementsForStudent(
  records: AnnouncementRecord[],
  studentId: string,
  enrolledCourseIds: string[],
): AnnouncementRecord[] {
  return sortNewestFirst(
    records
      .map(normalizeAnnouncementRecord)
      .filter((record) => isAnnouncementVisibleToStudent(record, studentId, enrolledCourseIds)),
  )
}

export function filterAnnouncementsForInstructorFeed(
  records: AnnouncementRecord[],
  instructorId: string,
  teachingCourseIds: string[],
): AnnouncementRecord[] {
  return sortNewestFirst(
    records
      .map(normalizeAnnouncementRecord)
      .filter((record) => isAnnouncementVisibleToInstructor(record, instructorId, teachingCourseIds)),
  )
}

export function toStudentAnnouncementItems(
  records: AnnouncementRecord[],
): StudentAnnouncementItem[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    body: record.body,
    author: record.authorName,
    postedAt: formatAnnouncementDate(record.postedAt),
    priority: record.priority,
    course: record.courseCode,
  }))
}

export function toInstructorAnnouncementItems(
  records: AnnouncementRecord[],
  instructorId?: string,
): InstructorAnnouncementItem[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    body: record.body,
    postedAt: formatAnnouncementDate(record.postedAt),
    priority: record.priority,
    course: record.courseCode,
    views: record.views,
    authorName: record.authorName,
    isOwn: instructorId ? record.authorId === instructorId : undefined,
  }))
}

export function toAdminAnnouncementItems(records: AnnouncementRecord[]): AdminAnnouncementItem[] {
  return records.map((record) => {
    const normalized = normalizeAnnouncementRecord(record)
    return {
      id: normalized.id,
      title: normalized.title,
      body: normalized.body,
      audience: formatAnnouncementAudience(normalized),
      postedAt: formatAnnouncementDate(normalized.postedAt),
      priority: normalized.priority,
      author: normalized.authorName,
      authorRole: normalized.authorRole,
      course: normalized.courseCode,
      views: normalized.views,
    }
  })
}

export function recordToFormInput(record: AnnouncementRecord) {
  const normalized = normalizeAnnouncementRecord(record)
  return {
    title: normalized.title,
    body: normalized.body,
    priority: normalized.priority,
    targetRoles: normalized.targetRoles,
    instructorAudience: normalized.instructorAudience,
    courseEnabled: Boolean(normalized.courseId),
    courseId: normalized.courseId,
    specificStudentsEnabled:
      normalized.instructorAudience === 'selected_students' ||
      (normalized.targetPersonIds?.length ?? 0) > 0,
    targetPersonIds: normalized.targetPersonIds ?? [],
  }
}

export function recordToInstructorFormInput(record: AnnouncementRecord) {
  const normalized = normalizeAnnouncementRecord(record)
  let audience: InstructorAnnouncementAudience = 'all_my_students'

  if (
    normalized.instructorAudience === 'selected_students' ||
    (normalized.targetPersonIds?.length ?? 0) > 0
  ) {
    audience = 'selected_students'
  } else if (normalized.instructorAudience === 'course' || normalized.courseId) {
    audience = 'course'
  }

  return {
    title: normalized.title,
    body: normalized.body,
    priority: normalized.priority,
    targetRoles: [] as AnnouncementTargetRole[],
    instructorAudience: audience,
    courseEnabled: audience === 'course',
    courseId: audience === 'course' ? normalized.courseId : undefined,
    specificStudentsEnabled: audience === 'selected_students',
    targetPersonIds: normalized.targetPersonIds ?? [],
  }
}

export function isCampusWideAnnouncement(record: AnnouncementRecord): boolean {
  const normalized = normalizeAnnouncementRecord(record)
  return ALL_ANNOUNCEMENT_TARGET_ROLES.every((role) => normalized.targetRoles.includes(role))
}
