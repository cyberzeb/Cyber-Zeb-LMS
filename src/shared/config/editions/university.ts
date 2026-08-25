import type { EditionConfig } from './types'

const universityTerminology = {
  organization: 'Institution',
  location: 'Campus',
  department: 'Department',
  team: 'Team',
  employee: 'Staff Member',
  employees: 'Staff',
  trainer: 'Instructor',
  training: 'Learning',
  trainingCatalog: 'Courses',
  trainingAssignment: 'Enrollments',
  course: 'Course',
  enrollment: 'Enrollment',
  certificate: 'Certificate',
  compliance: 'Compliance',
  adminRole: 'Institution Admin',
  learnerPortal: 'Student Portal',
} as const

/** Reference config — University behavior is driven by InstitutionAdminLayout. */
export const universityEditionConfig: EditionConfig = {
  edition: 'university',
  tenantType: 'university',
  defaultOrganizationName: 'Berana University',
  terminology: universityTerminology,
  modules: {
    campuses: true,
    colleges: true,
    programs: true,
    students: true,
    instructors: true,
    guardians: true,
    enrollments: true,
    teams: false,
    employees: false,
    compliance: false,
  },
  navSections: [],
  breadcrumbLabels: {},
}
