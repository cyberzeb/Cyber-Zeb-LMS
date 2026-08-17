import type { CourseEnrollment, CourseRecord } from '../../modules/institution/types'
import { DEMO_LEARNING_COURSE_ID } from '../../modules/institution/data/demoLearningCourse'
import { seedCourses } from '../../modules/institution/data/courseSeedData'
import {
  seedCampuses,
  seedColleges,
  seedDepartments,
} from '../../modules/institution/data/orgSeedData'
import { seedPeople } from '../../modules/institution/data/peopleSeedData'
import { ensureDemoStudentInPeople } from '../data/demoStudent'
import { createId } from '../hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from './keys'
import {
  readCampusRecords,
  readCourses,
  readDepartments,
  readEnrollments,
  readPeople,
} from './readers'

const INSTRUCTOR_IDS: Record<string, string> = {
  'Dr. Aaron Selassie': 'u2',
  'Prof. Elias Hailu': 'u6',
  'Dr. Martha Bekele': 'u3',
  'Wzro. Kidist Yohannes': 'u7',
  'Dr. Tigist Assefa': 'u9',
}

const EXTRA_STUDENTS = [
  {
    id: 'u17',
    name: 'Sara Negash',
    email: 'sara.negash@berana.edu',
    role: 'Student' as const,
    department: 'Computer Science',
    campusId: 'c1',
    status: 'active' as const,
    lastActive: '1 hour ago',
    initials: 'SN',
  },
  {
    id: 'u18',
    name: 'Tomas Bekele',
    email: 'tomas.bekele@berana.edu',
    role: 'Student' as const,
    department: 'Computer Science',
    campusId: 'c1',
    status: 'active' as const,
    lastActive: '3 hours ago',
    initials: 'TB',
  },
]

function dispatchSeedEvents() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.coursesUpdated))
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.enrollmentsUpdated))
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.peopleUpdated))
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.orgUpdated))
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

/** Populates org, people, courses, and enrollments when storage is empty (demo/testing). */
export function ensureDemoSeedData() {
  try {
    let changed = false

    if (readCampusRecords().length === 0) {
      window.localStorage.setItem(STORAGE_KEYS.campuses, JSON.stringify(seedCampuses))
      window.localStorage.setItem(STORAGE_KEYS.colleges, JSON.stringify(seedColleges))
      changed = true
    }

    if (readDepartments().length === 0) {
      window.localStorage.setItem(STORAGE_KEYS.departments, JSON.stringify(seedDepartments))
      changed = true
    }

    if (readPeople().length === 0) {
      const people = ensureDemoStudentInPeople([...seedPeople, ...EXTRA_STUDENTS])
      window.localStorage.setItem(STORAGE_KEYS.people, JSON.stringify(people))
      changed = true
    }

    const existingCourses = readCourses()
    const hasCatalogCourses = existingCourses.some((course) => course.id !== DEMO_LEARNING_COURSE_ID)
    if (!hasCatalogCourses) {
      const catalog = seedCourseRecords()
      const merged = [...catalog, ...existingCourses.filter((course) => course.id === DEMO_LEARNING_COURSE_ID)]
      window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(merged))
      changed = true
    }

    if (readEnrollments().length === 0) {
      const courses = readCourses()
      const enrollments = seedEnrollmentRecords(courses)
      window.localStorage.setItem(STORAGE_KEYS.enrollments, JSON.stringify(enrollments))

      const enrollmentCounts = new Map<string, number>()
      enrollments.forEach((enrollment) => {
        if (enrollment.status !== 'active') return
        enrollmentCounts.set(enrollment.courseId, (enrollmentCounts.get(enrollment.courseId) ?? 0) + 1)
      })

      const coursesWithCounts = courses.map((course) => ({
        ...course,
        enrolledCount: enrollmentCounts.get(course.id) ?? course.enrolledCount,
      }))
      window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(coursesWithCounts))
      changed = true
    }

    if (!window.localStorage.getItem(STORAGE_KEYS.settings)) {
      window.localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify({
          general: { name: 'Berana University' },
        }),
      )
      changed = true
    }

    if (changed) {
      dispatchSeedEvents()
    }
  } catch {
    /* storage blocked */
  }
}
