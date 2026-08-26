import type { PersonRow } from '../../modules/institution/types'

export const DEMO_INSTRUCTOR_ID = 'u2'

export const DEMO_INSTRUCTOR = {
  id: DEMO_INSTRUCTOR_ID,
  name: 'Dr. Aaron Selassie',
  email: 'a.selassie@berana.edu',
  title: 'Senior Lecturer',
  department: 'Computer Science',
  campusId: 'c1',
  initials: 'AS',
  term: 'Spring 2026',
  officeHours: 'Tue & Thu, 2:00–4:00 PM',
  specialization: 'Software Engineering & Algorithms',
  status: 'active' as const,
  lastActive: '10 min ago',
}

export function demoInstructorPersonRow(): PersonRow {
  return {
    id: DEMO_INSTRUCTOR.id,
    name: DEMO_INSTRUCTOR.name,
    email: DEMO_INSTRUCTOR.email,
    role: 'Instructor',
    department: DEMO_INSTRUCTOR.department,
    campusId: DEMO_INSTRUCTOR.campusId,
    status: DEMO_INSTRUCTOR.status,
    lastActive: DEMO_INSTRUCTOR.lastActive,
    initials: DEMO_INSTRUCTOR.initials,
    verificationStatus: 'verified',
  }
}
