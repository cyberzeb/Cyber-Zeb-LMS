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
  seedColleges,
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
  const { courses, courseOfferings, enrollments } = buildSeedOfferingsAndEnrollments(coursesBase)
  const people = ensureDemoStudentInPeople(seedPeople)

  return {
    campuses: seedCampuses,
    colleges: seedColleges,
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
