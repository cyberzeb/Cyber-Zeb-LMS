import type { PersonRow } from '../../modules/institution/types'

export const DEMO_STUDENT_ID = 'u-demo-amina'

export const DEMO_STUDENT = {
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

export function demoStudentPersonRow(): PersonRow {
  return {
    id: DEMO_STUDENT.id,
    name: DEMO_STUDENT.name,
    email: DEMO_STUDENT.email,
    role: 'Student',
    department: DEMO_STUDENT.department,
    campusId: DEMO_STUDENT.campusId,
    status: DEMO_STUDENT.status,
    lastActive: DEMO_STUDENT.lastActive,
    initials: DEMO_STUDENT.initials,
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
