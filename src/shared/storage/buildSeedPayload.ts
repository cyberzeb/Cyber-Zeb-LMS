/**
 * Builds the full demo seed payload for the backend (mirrors ensureDemoSeedData + ensureDemoLearningCourse).
 */
import type { CourseEnrollment, CourseRecord } from '../../modules/institution/types'
import { createDemoLearningCourse, DEMO_LEARNING_COURSE_ID } from '../../modules/institution/data/demoLearningCourse'
import { seedCourses } from '../../modules/institution/data/courseSeedData'
import {
  seedCampuses,
  seedColleges,
  seedDepartments,
} from '../../modules/institution/data/orgSeedData'
import { seedPeople } from '../../modules/institution/data/peopleSeedData'
import { ensureDemoStudentInPeople } from '../data/demoStudent'
import { createId } from '../hooks/useLocalStorageState'
import {
  seedAssignments,
  seedLiveSessions,
  seedQuestions,
  seedQuizzes,
  seedStudentSubmissions,
} from '../../modules/institution/data/assessmentSeedData'
import {
  seedHelpDeskTickets,
  seedIntegrations,
  seedPayments,
} from '../../modules/institution/data/platformSeedData'
import { seedCertificates } from '../../modules/institution/data/certificatesSeedData'
import { seedAttendance } from '../../modules/institution/data/attendanceSeedData'
import { defaultInstitutionSettings } from './settingsUtils'

const INSTRUCTOR_IDS: Record<string, string> = {
  'Dr. Aaron Selassie': 'u2',
  'Prof. Elias Hailu': 'u6',
  'Dr. Martha Bekele': 'u3',
  'Wzro. Kidist Yohannes': 'u7',
  'Dr. Tigist Assefa': 'u9',
}

function seedCourseRecords(): CourseRecord[] {
  return seedCourses
    .filter((course) => course.status === 'published')
    .map((course) => ({
      ...course,
      approvalStatus: 'approved' as const,
      instructorId: INSTRUCTOR_IDS[course.instructor],
      discussionForumEnabled: true,
      allowSelfEnrollment: false,
      certificateEnabled: true,
      visibility: 'private' as const,
    }))
}

function buildEnrollment(
  studentId: string,
  studentName: string,
  course: Pick<CourseRecord, 'id' | 'code' | 'title'>,
  progress = 0,
): CourseEnrollment {
  return {
    id: createId('enr'),
    studentId,
    studentName,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    program: 'Undergraduate',
    campus: 'Main Campus — Addis Ababa',
    enrolledOn: '2026-01-10',
    status: 'active',
    progress,
  }
}

function seedEnrollmentRecords(courses: CourseRecord[]): CourseEnrollment[] {
  const byCode = (code: string) => courses.find((course) => course.code === code)
  const cyber = courses.find((course) => course.id === DEMO_LEARNING_COURSE_ID) ?? byCode('CYB-101')
  const cs201 = byCode('CS-201')
  const cs340 = byCode('CS-340')
  const bus110 = byCode('BUS-110')
  const cyb501 = byCode('CYB-501')

  const enrollments: CourseEnrollment[] = []

  if (cyber) {
    enrollments.push(
      buildEnrollment('u-demo-amina', 'Amina Lemma', cyber, 18),
      buildEnrollment('u1', 'Selam Girma', cyber, 24),
      buildEnrollment('u10', 'Bruk Alemu', cyber, 12),
    )
  }

  if (cs201) {
    enrollments.push(
      buildEnrollment('u-demo-amina', 'Amina Lemma', cs201, 42),
      buildEnrollment('u1', 'Selam Girma', cs201, 55),
      buildEnrollment('u10', 'Bruk Alemu', cs201, 38),
      buildEnrollment('u17', 'Sara Negash', cs201, 61),
    )
  }

  if (cs340) {
    enrollments.push(
      buildEnrollment('u-demo-amina', 'Amina Lemma', cs340, 20),
      buildEnrollment('u17', 'Sara Negash', cs340, 33),
      buildEnrollment('u18', 'Tomas Bekele', cs340, 15),
    )
  }

  if (bus110) {
    enrollments.push(buildEnrollment('u10', 'Bruk Alemu', bus110, 48))
  }

  if (cyb501) {
    enrollments.push(buildEnrollment('u18', 'Tomas Bekele', cyb501, 8))
  }

  return enrollments
}

function mergeDemoLearningCourse(catalog: CourseRecord[]): CourseRecord[] {
  const demo = createDemoLearningCourse()
  const existingIndex = catalog.findIndex((c) => c.id === DEMO_LEARNING_COURSE_ID)
  if (existingIndex === -1) {
    return [demo, ...catalog]
  }
  const merged = {
    ...demo,
    enrolledCount: catalog[existingIndex].enrolledCount,
    instructorId: catalog[existingIndex].instructorId ?? demo.instructorId,
    instructor: catalog[existingIndex].instructor || demo.instructor,
  }
  const next = [...catalog]
  next[existingIndex] = merged
  return next
}

/** Collection keys match backend lms_store (berana: prefix stripped, camelCase kept). */
export function buildSeedPayload(): Record<string, unknown> {
  const catalog = seedCourseRecords()
  let courses = mergeDemoLearningCourse(catalog)
  const enrollments = seedEnrollmentRecords(courses)

  const enrollmentCounts = new Map<string, number>()
  enrollments.forEach((enrollment) => {
    if (enrollment.status !== 'active') return
    enrollmentCounts.set(enrollment.courseId, (enrollmentCounts.get(enrollment.courseId) ?? 0) + 1)
  })

  courses = courses.map((course) => ({
    ...course,
    enrolledCount: enrollmentCounts.get(course.id) ?? course.enrolledCount,
  }))

  const people = ensureDemoStudentInPeople(seedPeople)

  return {
    campuses: seedCampuses,
    colleges: seedColleges,
    departments: seedDepartments,
    people,
    courses,
    enrollments,
    certificates: seedCertificates,
    attendances: seedAttendance,
    settings: defaultInstitutionSettings,
    selectedCampus: 'all',
    reports: [],
    'lesson-progress': {},
    'lesson-responses': {},
    announcements: [],
    'forum-chats': [],
    'forum-messages': [],
    'forum-read-state': {},
    'live-sessions': seedLiveSessions,
    assignments: seedAssignments,
    quizzes: seedQuizzes,
    'question-bank': seedQuestions,
    'student-submissions': seedStudentSubmissions,
    payments: seedPayments,
    'help-desk-tickets': seedHelpDeskTickets,
    integrations: seedIntegrations,
    programs: [],
    'student-settings': {},
    'instructor-settings': {},
    'staff-settings': {},
    'guardian-settings': {},
    'help-desk-settings': {},
  }
}
