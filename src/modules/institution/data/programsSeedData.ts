/**
 * Demo degree programs (University Edition).
 *
 * Campus → Department → Program → Curriculum (course by year and semester)
 *        → Course section (offering) → Enrollment
 *
 * Every department offers a bachelor's program whose curriculum is the set of
 * sections it already runs; Computer Science also offers an MSc, so one
 * department with several programs is part of the demo.
 */
import type { CourseRecord, CurriculumEntry, Department, PersonRow, ProgramRow } from '../types'
import type { CourseOfferingRecord } from '../types/academic'
import { formatDuration } from '../utils/programUtils'

/** The bachelor's program each demo department runs. */
const BACHELOR_PROGRAMS: Record<string, { code: string; name: string }> = {
  d1: { code: 'BSC-CS', name: 'BSc in Computer Science' },
  d2: { code: 'BSC-SE', name: 'BSc in Software Engineering' },
  d3: { code: 'BSC-IT', name: 'BSc in Information Technology' },
  d4: { code: 'BBA', name: 'Bachelor of Business Administration' },
}

export function programIdForDepartment(departmentId: string): string {
  return `prog-${departmentId}`
}

export const MSC_CS_PROGRAM_ID = 'prog-d1-msc'

function curriculumFromOfferings(offerings: CourseOfferingRecord[], departmentId: string): CurriculumEntry[] {
  const seen = new Set<string>()
  const entries: CurriculumEntry[] = []
  for (const o of offerings) {
    if (o.departmentId !== departmentId) continue
    const key = `${o.courseId}:${o.studyYear}:${o.programSemester ?? 1}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ courseId: o.courseId, studyYear: o.studyYear, semester: o.programSemester ?? 1, type: 'core' })
  }
  return entries.sort((a, b) => a.studyYear - b.studyYear || a.semester - b.semester)
}

export function buildSeedPrograms(
  departments: Department[],
  offerings: CourseOfferingRecord[],
  people: PersonRow[],
  courses: CourseRecord[],
): ProgramRow[] {
  const bachelors = departments.map((department): ProgramRow => {
    const id = programIdForDepartment(department.id)
    const meta = BACHELOR_PROGRAMS[department.id] ?? {
      code: department.id.toUpperCase(),
      name: `BSc in ${department.name}`,
    }
    const curriculum = curriculumFromOfferings(offerings, department.id)
    return {
      id,
      code: meta.code,
      name: meta.name,
      level: 'Undergraduate',
      departmentId: department.id,
      department: department.name,
      campusId: department.campusId,
      duration: formatDuration(4),
      durationYears: 4,
      semestersPerYear: 2,
      totalCredits: 140,
      curriculum,
      enrolledCount: people.filter((p) => p.role === 'Student' && p.programId === id).length,
      courseCount: new Set(curriculum.map((e) => e.courseId)).size,
      status: 'active',
    }
  })

  // A second program in Computer Science: a two-year MSc built on advanced courses.
  const cs = departments.find((d) => d.id === 'd1')
  const byCode = new Map(courses.map((c) => [c.code, c.id]))
  const mscPlan: [string, number, number, CurriculumEntry['type']][] = [
    ['CS-301', 1, 1, 'core'],
    ['CS-220', 1, 1, 'core'],
    ['CS-340', 1, 2, 'core'],
    ['CYB-101', 1, 2, 'elective'],
  ]
  const mscCurriculum = mscPlan
    .filter(([code]) => byCode.has(code))
    .map(([code, studyYear, semester, type]) => ({ courseId: byCode.get(code)!, studyYear, semester, type }))
  const msc: ProgramRow[] = cs
    ? [
        {
          id: MSC_CS_PROGRAM_ID,
          code: 'MSC-CS',
          name: 'MSc in Computer Science',
          level: 'Postgraduate',
          departmentId: cs.id,
          department: cs.name,
          campusId: cs.campusId,
          duration: formatDuration(2),
          durationYears: 2,
          semestersPerYear: 2,
          totalCredits: 60,
          description: 'Advanced study in algorithms, systems and security, with a research thesis in year 2.',
          curriculum: mscCurriculum,
          enrolledCount: 0,
          courseCount: mscCurriculum.length,
          status: 'active',
        },
      ]
    : []

  return [...bachelors, ...msc]
}
