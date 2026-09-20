/**
 * Degree programs — the level between Department and Course in the University
 * Edition hierarchy (Campus → College → Department → Program → Course → Offering).
 *
 * Each department runs one degree program in the demo data, built from the
 * department's own program code, level and duration.
 */
import type { Department, ProgramRow } from '../types'
import { seedDepartments } from './orgSeedData'

const LEVEL_PREFIX: Record<string, string> = {
  Undergraduate: 'BSc in',
  Postgraduate: 'MSc in',
  Diploma: 'Diploma in',
  Certificate: 'Certificate in',
}

export function programIdForDepartment(departmentId: string): string {
  return `prog-${departmentId}`
}

export function buildProgramsFromDepartments(
  departments: Department[] = seedDepartments,
  counts: Record<string, { students: number; courses: number }> = {},
): ProgramRow[] {
  return departments.map((department) => {
    const level = department.programLevel ?? 'Undergraduate'
    const years = department.maxYears ?? 4
    const stats = counts[department.id]
    return {
      id: programIdForDepartment(department.id),
      code: department.programCode ?? department.id.toUpperCase(),
      name: `${LEVEL_PREFIX[level] ?? 'Program in'} ${department.name}`,
      level,
      department: department.name,
      departmentId: department.id,
      collegeId: department.collegeId,
      campusId: department.campusId,
      duration: `${years} year${years === 1 ? '' : 's'}`,
      durationYears: years,
      semestersPerYear: department.semestersPerYear ?? 2,
      enrolledCount: stats?.students ?? department.studentsCount ?? 0,
      courseCount: stats?.courses ?? 0,
      status: 'active' as const,
    }
  })
}

export const seedPrograms: ProgramRow[] = buildProgramsFromDepartments()
