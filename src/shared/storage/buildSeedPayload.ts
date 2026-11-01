/**
 * Builds the full demo seed payload for the backend and offline bootstrap.
 */
import { createDemoLearningCourse, DEMO_LEARNING_COURSE_ID } from '../../modules/institution/data/demoLearningCourse'
import {
  seedAcademicTerms,
  seedAcademicYears,
} from '../../modules/institution/data/academicSeedData'
import {
  seedCampuses,
  seedDepartments,
} from '../../modules/institution/data/orgSeedData'
import { seedPeople } from '../../modules/institution/data/peopleSeedData'
import { ensureDemoStudentInPeople } from '../data/demoStudent'
import type { CourseRecord } from '../../modules/institution/types'
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
import {
  buildSeedOfferingsAndEnrollments,
  seedCourseRecords,
} from './seedBuilders'
import { buildAcademicHistory } from '../../modules/institution/data/academicHistorySeed'
import { buildSeedPrograms, programIdForDepartment } from '../../modules/institution/data/programsSeedData'

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
  const coursesBase = mergeDemoLearningCourse(catalog)
  const { courses, courseOfferings: deptOfferings, enrollments } = buildSeedOfferingsAndEnrollments(coursesBase)

  // Department → Program: each student studies their department's bachelor's
  // program, and each section serves that program's curriculum.
  const people = ensureDemoStudentInPeople(seedPeople).map((p) =>
    p.role === 'Student' && p.departmentId && !p.programId
      ? { ...p, programId: programIdForDepartment(p.departmentId) }
      : p,
  )
  const courseOfferings = deptOfferings.map((o) => ({ ...o, programId: o.programId ?? programIdForDepartment(o.departmentId) }))
  const programs = buildSeedPrograms(seedDepartments, courseOfferings, people, courses)

  // Coursework and grades for every offering, so transcripts have real history.
  const history = buildAcademicHistory(courseOfferings, enrollments, courses, seedAcademicTerms)

  return {
    campuses: seedCampuses,
    departments: seedDepartments,
    'academic-years': seedAcademicYears,
    'academic-terms': seedAcademicTerms,
    'course-offerings': courseOfferings,
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
    assignments: [...seedAssignments, ...history.assignments],
    quizzes: [...seedQuizzes, ...history.quizzes],
    'question-bank': seedQuestions,
    'student-submissions': [...seedStudentSubmissions, ...history.submissions],
    payments: seedPayments,
    'help-desk-tickets': seedHelpDeskTickets,
    integrations: seedIntegrations,
    programs,
    'student-settings': {},
    'instructor-settings': {},
    'staff-settings': {},
    'guardian-settings': {},
    'help-desk-settings': {},
  }
}
