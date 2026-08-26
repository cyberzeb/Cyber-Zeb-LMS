import type { AcademicTermRecord, AcademicYearRecord, CourseOfferingRecord } from '../types/academic'

const CAMPUS_ID = 'c1'
const PROGRAM_YEARS = 4

/** Build a stable academic calendar: `programYears` × 2 semesters (Fall + Spring). */
function buildUniversityCalendar(programYears: number = PROGRAM_YEARS): {
  years: AcademicYearRecord[]
  terms: AcademicTermRecord[]
} {
  const years: AcademicYearRecord[] = []
  const terms: AcademicTermRecord[] = []
  const baseYear = 2025

  for (let i = 0; i < programYears; i++) {
    const start = baseYear + i
    const end = start + 1
    const yearId = `ay-${start}-${end}`

    years.push({
      id: yearId,
      code: `${start}-${end}`,
      name: `Academic Year ${start}–${end}`,
      campusId: CAMPUS_ID,
      startDate: `${start}-09-01`,
      endDate: `${end}-08-31`,
      isCurrent: i === 0,
    })

    terms.push({
      id: `term-${start}-fall`,
      academicYearId: yearId,
      code: `${start}-FALL`,
      name: `Fall Semester ${start}`,
      campusId: CAMPUS_ID,
      termType: 'semester',
      status: i === 0 ? 'closed' : 'planned',
      startDate: `${start}-09-15`,
      endDate: `${start}-12-20`,
      registrationOpens: `${start}-08-01`,
      registrationCloses: `${start}-09-10`,
      classesStart: `${start}-09-15`,
      classesEnd: `${start}-12-06`,
      gradingDeadline: `${start}-12-20`,
      isCurrent: false,
    })

    terms.push({
      id: `term-${end}-spring`,
      academicYearId: yearId,
      code: `${end}-SPRING`,
      name: `Spring Semester ${end}`,
      campusId: CAMPUS_ID,
      termType: 'semester',
      status: i === 0 ? 'in_progress' : 'planned',
      startDate: `${end}-01-12`,
      endDate: `${end}-05-15`,
      registrationOpens: `${start}-11-15`,
      registrationCloses: `${end}-01-05`,
      classesStart: `${end}-01-12`,
      classesEnd: `${end}-05-01`,
      gradingDeadline: `${end}-05-15`,
      isCurrent: i === 0,
    })
  }

  return { years, terms }
}

const calendar = buildUniversityCalendar(PROGRAM_YEARS)

/** Demo academic years — 4-year program span. */
export const seedAcademicYears: AcademicYearRecord[] = calendar.years

/** Demo terms — Fall + Spring for each academic year. */
export const seedAcademicTerms: AcademicTermRecord[] = calendar.terms

export const CURRENT_TERM_ID = 'term-2026-spring'

export function getCurrentTerm(terms: AcademicTermRecord[] = seedAcademicTerms): AcademicTermRecord {
  return terms.find((t) => t.id === CURRENT_TERM_ID) ?? terms.find((t) => t.isCurrent) ?? terms[0]
}

const INSTRUCTOR_MAP: Record<string, { id: string; name: string }> = {
  'CS-101': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CS-102': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CS-201': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CS-220': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CS-301': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CS-340': { id: 'u2', name: 'Dr. Aaron Selassie' },
  'CYB-101': { id: 'u6', name: 'Prof. Elias Hailu' },
  'SE-101': { id: 'u6', name: 'Prof. Elias Hailu' },
  'SE-210': { id: 'u6', name: 'Prof. Elias Hailu' },
  'SE-220': { id: 'u6', name: 'Prof. Elias Hailu' },
  'IT-101': { id: 'u7', name: 'Kidist Yohannes' },
  'IT-205': { id: 'u7', name: 'Kidist Yohannes' },
  'IT-210': { id: 'u7', name: 'Kidist Yohannes' },
  'BUS-101': { id: 'u3', name: 'Dr. Martha Bekele' },
  'BUS-110': { id: 'u3', name: 'Dr. Martha Bekele' },
  'BUS-120': { id: 'u3', name: 'Dr. Martha Bekele' },
  'BUS-210': { id: 'u3', name: 'Dr. Martha Bekele' },
}

const COURSE_STUDY_YEAR: Record<string, number> = {
  'CS-101': 1,
  'CS-102': 1,
  'CYB-101': 1,
  'SE-101': 1,
  'IT-101': 1,
  'BUS-101': 1,
  'CS-201': 2,
  'CS-220': 2,
  'SE-210': 2,
  'IT-205': 2,
  'BUS-110': 1,
  'BUS-210': 2,
  'CS-301': 3,
  'CS-340': 3,
  'SE-220': 2,
  'IT-210': 2,
  'BUS-120': 1,
}

const COURSE_PROGRAM_SEMESTER: Record<string, number> = {
  'CS-101': 1,
  'CYB-101': 1,
  'SE-101': 1,
  'IT-101': 1,
  'BUS-101': 1,
  'CS-102': 2,
  'BUS-120': 2,
  'BUS-110': 2,
  'CS-201': 1,
  'CS-220': 1,
  'SE-210': 1,
  'IT-205': 1,
  'BUS-210': 1,
  'CS-301': 1,
  'SE-220': 2,
  'IT-210': 2,
  'CS-340': 2,
}

/** Build program curriculum offerings (study year + program semester — not calendar dates). */
export function buildCourseOfferingsFromCatalog(
  courses: Array<{
    id: string
    code: string
    title: string
    department: string
    instructor?: string
    instructorId?: string
    maxEnrollment?: number
    enrolledCount?: number
    deliveryMode?: string
  }>,
  departments: Array<{ id: string; name: string }>,
): CourseOfferingRecord[] {
  return courses
    .filter((c) => c.code)
    .map((course) => {
      const dept = departments.find((d) => d.name === course.department)
      const instructor = INSTRUCTOR_MAP[course.code]
      const studyYear = COURSE_STUDY_YEAR[course.code] ?? 1
      const programSemester = COURSE_PROGRAM_SEMESTER[course.code] ?? 1
      const deliveryMode =
        course.deliveryMode === 'Self-paced'
          ? 'self_paced'
          : course.deliveryMode === 'Hybrid'
            ? 'hybrid'
            : course.deliveryMode === 'Instructor-led' || course.deliveryMode === 'Live cohort'
              ? 'in_person'
              : 'online'

      return {
        id: `off-${course.code.toLowerCase()}-y${studyYear}-s${programSemester}`,
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        departmentId: dept?.id ?? 'd1',
        departmentName: course.department,
        studyYear,
        programSemester,
        campusId: CAMPUS_ID,
        sectionCode: '01',
        primaryInstructorId: course.instructorId ?? instructor?.id,
        primaryInstructorName: course.instructor ?? instructor?.name ?? 'TBD',
        deliveryMode,
        maxEnrollment: course.maxEnrollment ?? 60,
        enrolledCount: course.enrolledCount ?? 0,
        status: 'in_progress' as const,
        allowSelfEnrollment: false,
        certificateEnabled: true,
      }
    })
}

export { seedAcademicYears as academicYears, seedAcademicTerms as academicTerms }
