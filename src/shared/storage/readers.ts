import type {
  CampusRecord,
  CourseRecord,
  Department,
  PersonRow,
  ProgramRow,
  CourseEnrollment,
} from '../../modules/institution/types'
import type { AnnouncementRecord } from '../types/announcements'
import type { ForumChatRecord, ForumMessageRecord } from '../types/forum'
import { normalizeAnnouncementRecord } from './announcementUtils'
import { STORAGE_KEYS } from './keys'

function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null) return fallback
    return JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

export function readPeople(): PersonRow[] {
  return readJson<PersonRow[]>(STORAGE_KEYS.people, [])
}

export function readCourses(): CourseRecord[] {
  return readJson<CourseRecord[]>(STORAGE_KEYS.courses, [])
}

export function readCampusRecords(): CampusRecord[] {
  return readJson<CampusRecord[]>(STORAGE_KEYS.campuses, [])
}

export function readDepartments(): Department[] {
  return readJson<Department[]>(STORAGE_KEYS.departments, [])
}

export function readPrograms(): ProgramRow[] {
  return readJson<ProgramRow[]>(STORAGE_KEYS.programs, [])
}

export function readEnrollments(): CourseEnrollment[] {
  return readJson<CourseEnrollment[]>(STORAGE_KEYS.enrollments, [])
}

export function readInstitutionName(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.settings)
    if (!stored) return 'Berana LMS'
    const settings = JSON.parse(stored) as { general?: { name?: string } }
    return settings.general?.name?.trim() || 'Berana LMS'
  } catch {
    return 'Berana LMS'
  }
}

export function readPersonById(personId: string): PersonRow | undefined {
  return readPeople().find((p) => p.id === personId)
}

export function readPublishedApprovedCourses(): CourseRecord[] {
  return readCourses().filter(
    (c) =>
      c.status !== 'archived' &&
      (!c.approvalStatus || c.approvalStatus === 'approved'),
  )
}

export function readAnnouncements(): AnnouncementRecord[] {
  return readJson<AnnouncementRecord[]>(STORAGE_KEYS.announcements, []).map(normalizeAnnouncementRecord)
}

export function readForumChats(): ForumChatRecord[] {
  return readJson<ForumChatRecord[]>(STORAGE_KEYS.forumChats, [])
}

export function readForumMessages(): ForumMessageRecord[] {
  return readJson<ForumMessageRecord[]>(STORAGE_KEYS.forumMessages, [])
}

export function readForumReadState(): Record<string, Record<string, string>> {
  return readJson<Record<string, Record<string, string>>>(STORAGE_KEYS.forumReadState, {})
}
