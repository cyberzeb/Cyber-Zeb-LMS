import { isCorporateEdition } from './edition'
import { getTerminology } from './terminology'

export type EditionPageKey =
  | 'dashboard'
  | 'courses'
  | 'enrollments'
  | 'certificates'
  | 'assignments'
  | 'assessments'
  | 'liveClasses'
  | 'reports'
  | 'settings'
  | 'announcements'
  | 'forum'
  | 'helpDesk'
  | 'departments'

export interface PageCopy {
  title: string
  subtitle: string
}

const universityCopy: Record<EditionPageKey, PageCopy> = {
  dashboard: {
    title: 'Institution Dashboard',
    subtitle: 'Overview of campuses, enrollment, courses and operational health.',
  },
  courses: {
    title: 'Course Catalog',
    subtitle:
      'Author courses and assign a teaching instructor per course. Department grouping is organizational only.',
  },
  enrollments: {
    title: 'Enrollments',
    subtitle:
      'Students only appear on instructor rosters after you enroll them in a course here. Department assignment alone does not enroll anyone.',
  },
  certificates: {
    title: 'Certificates',
    subtitle: 'Issue, track and revoke completion certificates across courses and campuses.',
  },
  assignments: {
    title: 'Assignments',
    subtitle: 'Create and manage assignment tasks linked to courses.',
  },
  assessments: {
    title: 'Quizzes & Exams',
    subtitle: 'Build quizzes and exams, schedule attempts and review outcomes.',
  },
  liveClasses: {
    title: 'Live Classes',
    subtitle: 'Schedule and manage live instructor-led sessions.',
  },
  reports: {
    title: 'Reports & Analytics',
    subtitle: 'Generate operational and academic reports for your institution.',
  },
  settings: {
    title: 'Institution Settings',
    subtitle: 'Configure branding, modules, integrations and academic policies.',
  },
  announcements: {
    title: 'Announcements',
    subtitle: 'Broadcast updates to learners, instructors and staff.',
  },
  forum: {
    title: 'Discussion Forum',
    subtitle: 'Moderate course and community discussions.',
  },
  helpDesk: {
    title: 'Help Desk',
    subtitle: 'Track support tickets from learners and staff.',
  },
  departments: {
    title: 'Departments',
    subtitle: 'Manage academic departments, heads and campus placement.',
  },
}

export function getEditionPageCopy(key: EditionPageKey): PageCopy {
  if (!isCorporateEdition()) {
    return universityCopy[key]
  }

  const t = getTerminology()
  const corporateCopy: Record<EditionPageKey, PageCopy> = {
    dashboard: {
      title: 'Corporate Training Dashboard',
      subtitle: 'Regulatory training, compliance and workforce readiness for your organization.',
    },
    courses: {
      title: t.trainingCatalog,
      subtitle:
        'Create and publish training modules. Assign trainers per module — department grouping is organizational only.',
    },
    enrollments: {
      title: t.trainingAssignment,
      subtitle:
        'Assign training to employees here. Employees only see assigned training after you create an assignment.',
    },
    certificates: {
      title: 'Certifications',
      subtitle: 'Issue, track and revoke employee certifications for completed training.',
    },
    assignments: {
      title: 'Training Tasks',
      subtitle: 'Create practical tasks and submissions linked to training modules.',
    },
    assessments: {
      title: 'Assessments',
      subtitle: 'Build knowledge checks, quizzes and evaluations for training programs.',
    },
    liveClasses: {
      title: 'Live Training',
      subtitle: 'Schedule and manage live instructor-led training sessions.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Workforce training, compliance and certification analytics.',
    },
    settings: {
      title: 'Organization Settings',
      subtitle: 'Configure organization name, branding, modules and integrations.',
    },
    announcements: {
      title: 'Announcements',
      subtitle: 'Broadcast updates to employees, trainers and administrators.',
    },
    forum: {
      title: 'Discussions',
      subtitle: 'Moderate training and organization-wide discussions.',
    },
    helpDesk: {
      title: 'Help Desk',
      subtitle: 'Track support requests from employees and administrators.',
    },
    departments: {
      title: t.department + 's',
      subtitle: `Major business units (e.g. Retail Banking, Risk & Compliance). Used for reporting, bulk training assignment, and org structure.`,
    },
  }

  return corporateCopy[key]
}
