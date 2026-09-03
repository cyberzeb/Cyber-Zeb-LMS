import type {
  AcademicTermRecord,
  AcademicYearRecord,
  CourseOfferingRecord,
} from '../../modules/institution/types/academic'
import type {
  CampusRecord,
  CertificateRecord,
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
import { getCachedCollection } from './dataCache'
import { toApiKey } from '../api/collectionKeys'

function readCached<T>(storageKey: string, fallback: T): T {
  return getCachedCollection(toApiKey(storageKey), fallback)
}

export function readPeople(): PersonRow[] {
  return readCached<PersonRow[]>(STORAGE_KEYS.people, [])
}

export function readCourses(): CourseRecord[] {
  return readCached<CourseRecord[]>(STORAGE_KEYS.courses, [])
}

export function readCampusRecords(): CampusRecord[] {
  return readCached<CampusRecord[]>(STORAGE_KEYS.campuses, [])
}

export function readDepartments(): Department[] {
  return readCached<Department[]>(STORAGE_KEYS.departments, [])
}

export function readPrograms(): ProgramRow[] {
  return readCached<ProgramRow[]>(STORAGE_KEYS.programs, [])
}

export function readAcademicYears(): AcademicYearRecord[] {
  return readCached<AcademicYearRecord[]>(STORAGE_KEYS.academicYears, [])
}

export function readAcademicTerms(): AcademicTermRecord[] {
  return readCached<AcademicTermRecord[]>(STORAGE_KEYS.academicTerms, [])
}

export function readCourseOfferings(): CourseOfferingRecord[] {
  return readCached<CourseOfferingRecord[]>(STORAGE_KEYS.courseOfferings, [])
}

export function readCurrentAcademicTerm(): AcademicTermRecord | undefined {
  return readAcademicTerms().find((term) => term.isCurrent)
}

export function readEnrollments(): CourseEnrollment[] {
  return readCached<CourseEnrollment[]>(STORAGE_KEYS.enrollments, [])
}

export function readCertificates(): CertificateRecord[] {
  return readCached<CertificateRecord[]>(STORAGE_KEYS.certificates, [])
}

export function readInstitutionName(): string {
  const settings = readCached<{ general?: { name?: string } }>(STORAGE_KEYS.settings, {})
  return settings.general?.name?.trim() || 'Berana LMS'
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
  return readCached<AnnouncementRecord[]>(STORAGE_KEYS.announcements, []).map(normalizeAnnouncementRecord)
}

export function readLiveSessions() {
  return readCached<import('../../modules/institution/types/assessments').LiveSessionRecord[]>(
    STORAGE_KEYS.liveSessions,
    [],
  )
}

export function readAssignmentRecords() {
  return readCached<import('../../modules/institution/types/assessments').AssignmentRecord[]>(
    STORAGE_KEYS.assignments,
    [],
  )
}

export function readQuizRecords() {
  return readCached<import('../../modules/institution/types/assessments').QuizRecord[]>(
    STORAGE_KEYS.quizzes,
    [],
  )
}

export function readQuestionBank() {
  return readCached<import('../../modules/institution/types/assessments').QuestionRecord[]>(
    STORAGE_KEYS.questionBank,
    [],
  )
}

export function readStudentSubmissions() {
  return readCached<import('../../modules/institution/types/assessments').StudentSubmissionRecord[]>(
    STORAGE_KEYS.studentSubmissions,
    [],
  )
}

export function readAttendances() {
  return readCached<import('../../modules/institution/types').AttendanceRecord[]>(
    STORAGE_KEYS.attendances,
    [],
  )
}

export function readPayments() {
  return readCached<import('../../modules/institution/types/platform').PaymentRecord[]>(
    STORAGE_KEYS.payments,
    [],
  )
}

export function readHelpDeskTickets() {
  return readCached<import('../../modules/institution/types/platform').HelpDeskTicketRecord[]>(
    STORAGE_KEYS.helpDeskTickets,
    [],
  )
}

export function readIntegrations() {
  return readCached<import('../../modules/institution/types/platform').ApiIntegrationRecord[]>(
    STORAGE_KEYS.integrations,
    [],
  )
}

export function readForumChats(): ForumChatRecord[] {
  return readCached<ForumChatRecord[]>(STORAGE_KEYS.forumChats, [])
}

export function readForumMessages(): ForumMessageRecord[] {
  return readCached<ForumMessageRecord[]>(STORAGE_KEYS.forumMessages, [])
}

export function readForumReadState(): Record<string, Record<string, string>> {
  return readCached<Record<string, Record<string, string>>>(STORAGE_KEYS.forumReadState, {})
}

export function readLessonProgress(): Record<string, Record<string, string[]>> {
  return readCached<Record<string, Record<string, string[]>>>(STORAGE_KEYS.lessonProgress, {})
}

export function readLessonResponses(): Record<string, Record<string, Record<string, unknown[]>>> {
  return readCached<Record<string, Record<string, Record<string, unknown[]>>>>(STORAGE_KEYS.lessonResponses, {})
}

export function readSettings<T = unknown>(): T {
  return readCached<T>(STORAGE_KEYS.settings, {} as T)
}

export function readSelectedCampus(): string {
  return readCached<string>(STORAGE_KEYS.selectedCampus, 'all')
}

// ── Corporate edition readers ──────────────────────────────────────────────
import type { JobRole } from '../../modules/corporate/types'

export function readJobRoles(): JobRole[] {
  return readCached<JobRole[]>(STORAGE_KEYS.jobRoles, [])
}
