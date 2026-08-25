import { isCorporateEdition } from '../config/edition'
import type { PersonRow } from '../../modules/institution/types'

export const DEMO_STUDENT_ID = 'u-demo-amina'

const UNIVERSITY_DEMO = {
  id: DEMO_STUDENT_ID,
  name: 'Amina Lemma',
  email: 'amina.lemma@student.berana.edu',
  program: 'BSc Computer Science',
  term: 'Fall 2026',
  department: 'Computer Science & IT',
  campusId: 'c1',
  initials: 'AL',
  standing: 'On track for distinction',
  gpa: 3.84,
  status: 'active' as const,
  lastActive: '30 min ago',
}

const CORPORATE_DEMO = {
  id: DEMO_STUDENT_ID,
  name: 'Dawit Bekele',
  email: 'dawit.bekele@horizonbank.et',
  program: 'Customer Service Officer',
  term: 'Q3 2026',
  department: 'Retail Banking',
  campusId: 'c2',
  departmentId: 'd1' as string,
  teamId: 'team-2' as string,
  jobRoleId: 'jr-1' as string,
  initials: 'DB',
  standing: 'Compliant — 2 modules due this month',
  gpa: 92,
  status: 'active' as const,
  lastActive: '30 min ago',
}

export function getDemoStudentProfile() {
  return isCorporateEdition() ? CORPORATE_DEMO : UNIVERSITY_DEMO
}

/** @deprecated Use getDemoStudentProfile() — kept for existing imports. */
export const DEMO_STUDENT = UNIVERSITY_DEMO

export function demoStudentPersonRow(): PersonRow {
  if (isCorporateEdition()) {
    return {
      id: CORPORATE_DEMO.id,
      name: CORPORATE_DEMO.name,
      email: CORPORATE_DEMO.email,
      role: 'Student',
      department: CORPORATE_DEMO.department,
      campusId: CORPORATE_DEMO.campusId,
      departmentId: CORPORATE_DEMO.departmentId,
      teamId: CORPORATE_DEMO.teamId,
      jobRoleId: CORPORATE_DEMO.jobRoleId,
      status: CORPORATE_DEMO.status,
      lastActive: CORPORATE_DEMO.lastActive,
      initials: CORPORATE_DEMO.initials,
      verificationStatus: 'verified',
    }
  }

  const demo = UNIVERSITY_DEMO
  return {
    id: demo.id,
    name: demo.name,
    email: demo.email,
    role: 'Student',
    department: demo.department,
    campusId: demo.campusId,
    status: demo.status,
    lastActive: demo.lastActive,
    initials: demo.initials,
    verificationStatus: 'verified',
  }
}

export function ensureDemoStudentInPeople(people: PersonRow[]): PersonRow[] {
  const demo = demoStudentPersonRow()
  const index = people.findIndex((person) => person.id === demo.id)

  if (index >= 0) {
    const next = [...people]
    next[index] = { ...next[index], ...demo }
    return next
  }

  return [demo, ...people]
}
