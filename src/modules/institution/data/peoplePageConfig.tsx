import type { ReactNode } from 'react'
import {
  GraduationCap,
  Headset,
  MailPlus,
  Presentation,
  Shield,
  UserCog,
  Users,
  HeartHandshake,
  Briefcase,
} from 'lucide-react'
import type { PersonRole, PersonRow, CourseRecord } from '../types'

export type PeoplePageFocus = PersonRole | 'all'

export interface PeopleStatItem {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
}

export interface PeoplePageConfig {
  title: string
  subtitle: string
  inviteLabel: string
  inviteTitle: string
  inviteDescription: string
  defaultRole: PersonRole
  lockRole: boolean
  searchPlaceholder: string
  emptyMessage: string
  showRoleTabs: boolean
  hideRoleColumn: boolean
  getStats: (people: PersonRow[], courses?: CourseRecord[]) => PeopleStatItem[]
}

const STAT = 17

function countByRole(people: PersonRow[], role: PersonRole) {
  return people.filter((p) => p.role === role).length
}

function countByStatus(people: PersonRow[], status: PersonRow['status']) {
  return people.filter((p) => p.status === status).length
}

function filterRole(people: PersonRow[], role: PersonRole) {
  return people.filter((p) => p.role === role)
}

export const peoplePageConfigs: Record<PeoplePageFocus, PeoplePageConfig> = {
  all: {
    title: 'People & Users',
    subtitle:
      'Invite, import and manage every user account, role and access status in your institution.',
    inviteLabel: 'Invite User',
    inviteTitle: 'Invite User',
    inviteDescription: 'Send an invitation. The user stays pending until they activate.',
    defaultRole: 'Student',
    lockRole: false,
    searchPlaceholder: 'Search by name, email, department...',
    emptyMessage: 'No people match your filters.',
    showRoleTabs: true,
    hideRoleColumn: false,
    getStats: (people) => [
      { label: 'Total Users', value: people.length, icon: <Users size={STAT} /> },
      { label: 'Students', value: countByRole(people, 'Student'), icon: <GraduationCap size={STAT} /> },
      { label: 'Instructors', value: countByRole(people, 'Instructor'), icon: <Presentation size={STAT} /> },
      {
        label: 'Pending Invites',
        value: countByStatus(people, 'invited'),
        sub: 'Awaiting activation',
        icon: <MailPlus size={STAT} />,
      },
    ],
  },
  Student: {
    title: 'Students',
    subtitle:
      'Manage learner accounts, enrollment status, program placement and campus access for every student.',
    inviteLabel: 'Enroll Student',
    inviteTitle: 'Enroll New Student',
    inviteDescription:
      'Send an enrollment invitation. The student account stays pending until they activate their profile.',
    defaultRole: 'Student',
    lockRole: true,
    searchPlaceholder: 'Search students by name, email or program...',
    emptyMessage: 'No students match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people) => {
      const students = filterRole(people, 'Student')
      return [
        { label: 'Total Students', value: students.length, icon: <GraduationCap size={STAT} /> },
        { label: 'Active', value: countByStatus(students, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Enrollment',
          value: countByStatus(students, 'invited'),
          sub: 'Awaiting activation',
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Suspended',
          value: countByStatus(students, 'suspended'),
          icon: <Shield size={STAT} />,
        },
      ]
    },
  },
  Instructor: {
    title: 'Instructors',
    subtitle:
      'Faculty who teach and follow up on courses. Assign one or many courses per instructor — they are not tied to a department.',
    inviteLabel: 'Add Instructor',
    inviteTitle: 'Add Instructor',
    inviteDescription:
      'Create a faculty account and optionally assign the courses they will teach. You can add more course assignments anytime.',
    defaultRole: 'Instructor',
    lockRole: true,
    searchPlaceholder: 'Search instructors by name, email or course...',
    emptyMessage: 'No instructors match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people, courses = []) => {
      const instructors = filterRole(people, 'Instructor')
      const coursesWithInstructor = courses.filter(
        (c) => c.instructorId || (c.instructor && c.instructor !== 'Unassigned'),
      ).length
      return [
        { label: 'Total Instructors', value: instructors.length, icon: <Presentation size={STAT} /> },
        { label: 'Active', value: countByStatus(instructors, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(instructors, 'invited'),
          sub: 'Not yet activated',
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Courses Staffed',
          value: coursesWithInstructor,
          sub: 'With an assigned instructor',
          icon: <Briefcase size={STAT} />,
        },
      ]
    },
  },
  Staff: {
    title: 'Staff',
    subtitle:
      'Manage non-teaching personnel — registrars, finance and campus operations teams.',
    inviteLabel: 'Add Staff Member',
    inviteTitle: 'Invite Staff Member',
    inviteDescription:
      'Grant staff access to operational modules. Assign their office or department before sending the invite.',
    defaultRole: 'Staff',
    lockRole: true,
    searchPlaceholder: 'Search staff by name, email or office...',
    emptyMessage: 'No staff members match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people) => {
      const staff = filterRole(people, 'Staff')
      return [
        { label: 'Total Staff', value: staff.length, icon: <Briefcase size={STAT} /> },
        { label: 'Active', value: countByStatus(staff, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(staff, 'invited'),
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Offices',
          value: new Set(staff.map((p) => p.department)).size,
          sub: 'Represented',
          icon: <UserCog size={STAT} />,
        },
      ]
    },
  },
  HelpDesk: {
    title: 'Help Desk Agents',
    subtitle:
      'Support agents who handle tickets from students, instructors and staff. Separate portal UI from general staff.',
    inviteLabel: 'Add Help Desk Agent',
    inviteTitle: 'Invite Help Desk Agent',
    inviteDescription:
      'Grant help desk portal access for ticket management and support workflows.',
    defaultRole: 'HelpDesk',
    lockRole: true,
    searchPlaceholder: 'Search agents by name or email...',
    emptyMessage: 'No help desk agents match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people) => {
      const agents = filterRole(people, 'HelpDesk')
      return [
        { label: 'Total Agents', value: agents.length, icon: <Headset size={STAT} /> },
        { label: 'Active', value: countByStatus(agents, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(agents, 'invited'),
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Teams',
          value: new Set(agents.map((p) => p.department)).size,
          sub: 'Support teams',
          icon: <UserCog size={STAT} />,
        },
      ]
    },
  },
  Guardian: {
    title: 'Guardians',
    subtitle:
      'Manage parent and guardian accounts linked to student profiles for progress updates and communications.',
    inviteLabel: 'Add Guardian',
    inviteTitle: 'Invite Guardian',
    inviteDescription:
      'Send a guardian portal invitation. They will be able to view linked student progress after activation.',
    defaultRole: 'Guardian',
    lockRole: true,
    searchPlaceholder: 'Search guardians by name or email...',
    emptyMessage: 'No guardians match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people) => {
      const guardians = filterRole(people, 'Guardian')
      return [
        { label: 'Total Guardians', value: guardians.length, icon: <HeartHandshake size={STAT} /> },
        { label: 'Active', value: countByStatus(guardians, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(guardians, 'invited'),
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Portal Access',
          value: countByStatus(guardians, 'active'),
          sub: 'Can view linked students',
          icon: <Shield size={STAT} />,
        },
      ]
    },
  },
  Admin: {
    title: 'Administrators',
    subtitle:
      'Control institution admin accounts, campus-level permissions and platform configuration access.',
    inviteLabel: 'Add Administrator',
    inviteTitle: 'Invite Administrator',
    inviteDescription:
      'Grant administrative access to institution settings. Admins can manage users, reports and integrations.',
    defaultRole: 'Admin',
    lockRole: true,
    searchPlaceholder: 'Search admins by name, email or department...',
    emptyMessage: 'No administrators match your search.',
    showRoleTabs: false,
    hideRoleColumn: true,
    getStats: (people) => {
      const admins = filterRole(people, 'Admin')
      return [
        { label: 'Total Admins', value: admins.length, icon: <UserCog size={STAT} /> },
        { label: 'Active', value: countByStatus(admins, 'active'), icon: <Users size={STAT} /> },
        {
          label: 'Pending Invites',
          value: countByStatus(admins, 'invited'),
          icon: <MailPlus size={STAT} />,
        },
        {
          label: 'Departments',
          value: new Set(admins.map((p) => p.department)).size,
          sub: 'With admin coverage',
          icon: <Shield size={STAT} />,
        },
      ]
    },
  },
}

export const allPeopleTabs = ['All', 'Students', 'Instructors', 'Admins', 'Guardians', 'Staff', 'Help Desk']

export const tabToRole: Record<string, PersonRole> = {
  Students: 'Student',
  Instructors: 'Instructor',
  Admins: 'Admin',
  Guardians: 'Guardian',
  Staff: 'Staff',
  'Help Desk': 'HelpDesk',
}

export const roleOptions: PersonRole[] = [
  'Student',
  'Instructor',
  'Admin',
  'Guardian',
  'Staff',
  'HelpDesk',
]

export const departmentOptions = [
  'Computer Science & IT',
  'Business Administration',
  'Engineering & Technology',
  'Social Sciences',
  'Registrar Office',
  'Finance Office',
  'IT Support',
  '—',
]
