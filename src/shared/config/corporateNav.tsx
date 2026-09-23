/**
 * Corporate & Training edition navigation helpers for the main app.
 * These are used by CorporateAdminLayout and TrainingAdminLayout.
 */
import type { ReactNode } from 'react'

import type { ModuleKey } from '../constants/modules'
import {
  BookCheck,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Headset,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  MonitorPlay,
  Network,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  Sparkles,
  LibraryBig,
  UserCog,
  UserRoundCheck,
  Users,
  UsersRound,
} from 'lucide-react'

const ICON_SIZE = 17

export interface NavItem {
  label: string
  to: string
  active: boolean
  icon: ReactNode
  badge?: number
  /**
   * The module this destination needs. The sidebar locks the row when the
   * institution did not subscribe to it — same as the university layout.
   */
  module?: ModuleKey
  show?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

function isActive(routes: string[], path: string): boolean {
  return routes.some((route) => path === route)
}

export function buildCorporateNavSections(
  path: string,
  badges: Record<string, number> = {},
): NavSection[] {
  return [
    {
      title: 'Main',
      items: [
        {
          label: 'Dashboard',
          to: '/admin',
          active: isActive(['/admin', '/admin/institution/overview', '/admin/institution/dashboard'], path),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Organization',
          to: '/admin/corporate/organization',
          module: 'tenant_institution_mgmt',
          active: isActive(['/admin/corporate/organization'], path),
          icon: <Network size={ICON_SIZE} />,
        },
        {
          label: 'Departments',
          to: '/admin/corporate/departments',
          module: 'academic_structure',
          active: isActive(['/admin/corporate/departments'], path),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: 'Teams',
          to: '/admin/corporate/teams',
          module: 'academic_structure',
          active: isActive(['/admin/corporate/teams'], path),
          icon: <UsersRound size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Learning',
      items: [
        {
          label: 'Training Catalog',
          to: '/admin/courses',
          module: 'course_catalog_authoring',
          active: isActive(['/admin/courses'], path),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Training Assignments',
          to: '/admin/enrollments',
          module: 'enrollment_cohorts',
          active: isActive(['/admin/enrollments'], path),
          icon: <ClipboardCheck size={ICON_SIZE} />,
        },
        {
          label: 'Live Training',
          to: '/admin/live-classes',
          module: 'virtual_classroom',
          active: isActive(['/admin/live-classes'], path),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          module: 'assignments_assessments',
          active: isActive(['/admin/assignments'], path),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Assessments',
          to: '/admin/quizzes-exams',
          module: 'assignments_assessments',
          active: isActive(['/admin/quizzes-exams'], path),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
        {
          label: 'Question Bank',
          to: '/admin/question-bank',
          module: 'assignments_assessments',
          active: isActive(['/admin/question-bank'], path),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Training Library',
          to: '/admin/resources',
          module: 'content_management',
          active: isActive(['/admin/resources'], path),
          icon: <LibraryBig size={ICON_SIZE} />,
        },
        {
          label: 'Attendance',
          to: '/admin/attendance',
          module: 'attendance',
          active: isActive(['/admin/attendance'], path),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: 'Employees',
          to: '/admin/students',
          active: isActive(['/admin/students'], path),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Trainers',
          to: '/admin/instructors',
          active: isActive(['/admin/instructors'], path),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: 'Administrators',
          to: '/admin/admins',
          active: isActive(['/admin/admins'], path),
          icon: <Shield size={ICON_SIZE} />,
        },
        {
          label: 'Verify People',
          to: '/admin/verify-people',
          active: isActive(['/admin/verify-people'], path),
          icon: <ShieldCheck size={ICON_SIZE} />,
          badge: badges['verify-people'],
        },
      ],
    },
    {
      title: 'Compliance',
      items: [
        {
          label: 'Job Roles',
          to: '/admin/corporate/job-roles',
          module: 'academic_structure',
          active: isActive(['/admin/corporate/job-roles'], path),
          icon: <Briefcase size={ICON_SIZE} />,
        },
        {
          label: 'Skills',
          to: '/admin/corporate/skills',
          module: 'academic_structure',
          active: isActive(['/admin/corporate/skills'], path),
          icon: <Sparkles size={ICON_SIZE} />,
        },
        {
          label: 'Compliance',
          to: '/admin/corporate/compliance',
          module: 'reports_analytics',
          active: isActive(['/admin/corporate/compliance'], path),
          icon: <ShieldCheck size={ICON_SIZE} />,
        },
        {
          label: 'Certifications',
          to: '/admin/certificates',
          module: 'certificates_credentials',
          active: isActive(['/admin/certificates'], path),
          icon: <BookCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Announcements',
          to: '/admin/announcements',
          module: 'communication_notifications',
          active: isActive(['/admin/announcements'], path),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/admin/discussion-forum',
          module: 'communication_notifications',
          active: isActive(['/admin/discussion-forum'], path),
          icon: <MessageSquare size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Reports & Analytics',
          to: '/admin/reports',
          module: 'reports_analytics',
          active: isActive(['/admin/reports'], path),
          icon: <FileText size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/admin/help-desk',
          module: 'administration_support',
          active: isActive(['/admin/help-desk'], path),
          icon: <Headset size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/admin/settings',
          active: isActive(['/admin/settings'], path),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]
}

export function buildTrainingNavSections(
  path: string,
  badges: Record<string, number> = {},
): NavSection[] {
  return [
    {
      title: 'Main',
      items: [
        {
          label: 'Dashboard',
          to: '/admin',
          active: isActive(['/admin', '/admin/institution/overview', '/admin/institution/dashboard'], path),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Training Programs',
          to: '/admin/training/programs',
          module: 'academic_structure',
          active: isActive(['/admin/training/programs'], path),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
        {
          label: 'Cohorts',
          to: '/admin/training/cohorts',
          module: 'enrollment_cohorts',
          active: isActive(['/admin/training/cohorts'], path),
          icon: <UsersRound size={ICON_SIZE} />,
        },
        {
          label: 'Course Catalog',
          to: '/admin/courses',
          module: 'course_catalog_authoring',
          active: isActive(['/admin/courses'], path),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Course Offerings',
          to: '/admin/course-offerings',
          module: 'course_catalog_authoring',
          active: isActive(['/admin/course-offerings'], path),
          icon: <ClipboardCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Delivery',
      items: [
        {
          label: 'Live Sessions',
          to: '/admin/live-classes',
          module: 'virtual_classroom',
          active: isActive(['/admin/live-classes'], path),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          module: 'assignments_assessments',
          active: isActive(['/admin/assignments'], path),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Assessments',
          to: '/admin/quizzes-exams',
          module: 'assignments_assessments',
          active: isActive(['/admin/quizzes-exams'], path),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
        {
          label: 'Question Bank',
          to: '/admin/question-bank',
          module: 'assignments_assessments',
          active: isActive(['/admin/question-bank'], path),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Library & Resources',
          to: '/admin/resources',
          module: 'content_management',
          active: isActive(['/admin/resources'], path),
          icon: <LibraryBig size={ICON_SIZE} />,
        },
        {
          label: 'Attendance',
          to: '/admin/attendance',
          module: 'attendance',
          active: isActive(['/admin/attendance'], path),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: 'Learners',
          to: '/admin/students',
          active: isActive(['/admin/students'], path),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Trainers',
          to: '/admin/instructors',
          active: isActive(['/admin/instructors'], path),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: 'Administrators',
          to: '/admin/admins',
          active: isActive(['/admin/admins'], path),
          icon: <Shield size={ICON_SIZE} />,
        },
        {
          label: 'Verify People',
          to: '/admin/verify-people',
          active: isActive(['/admin/verify-people'], path),
          icon: <ShieldCheck size={ICON_SIZE} />,
          badge: badges['verify-people'],
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Certifications',
          to: '/admin/certificates',
          module: 'certificates_credentials',
          active: isActive(['/admin/certificates'], path),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Announcements',
          to: '/admin/announcements',
          module: 'communication_notifications',
          active: isActive(['/admin/announcements'], path),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/admin/discussion-forum',
          module: 'communication_notifications',
          active: isActive(['/admin/discussion-forum'], path),
          icon: <MessageSquare size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Reports & Analytics',
          to: '/admin/reports',
          module: 'reports_analytics',
          active: isActive(['/admin/reports'], path),
          icon: <FileText size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/admin/help-desk',
          module: 'administration_support',
          active: isActive(['/admin/help-desk'], path),
          icon: <Headset size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/admin/settings',
          active: isActive(['/admin/settings'], path),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]
}

export const CORPORATE_BREADCRUMB_LABELS: Record<string, string> = {
  '/admin/question-bank': 'Question Bank',
  '/admin/resources': 'Training Library',
  '/admin/attendance': 'Attendance',
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/corporate/organization': 'Organization Structure',
  '/admin/corporate/departments': 'Departments',
  '/admin/corporate/teams': 'Teams',
  '/admin/corporate/job-roles': 'Job Roles',
  '/admin/corporate/skills': 'Skills',
  '/admin/corporate/compliance': 'Compliance',
  '/admin/courses': 'Training Catalog',
  '/admin/enrollments': 'Training Assignments',
  '/admin/live-classes': 'Live Training',
  '/admin/assignments': 'Assignments',
  '/admin/quizzes-exams': 'Assessments',
  '/admin/students': 'Employees',
  '/admin/instructors': 'Trainers',
  '/admin/admins': 'Administrators',
  '/admin/verify-people': 'Verify People',
  '/admin/certificates': 'Certifications',
  '/admin/announcements': 'Announcements',
  '/admin/discussion-forum': 'Discussions',
  '/admin/reports': 'Reports & Analytics',
  '/admin/help-desk': 'Help Desk',
  '/admin/settings': 'Organization Settings',
}

export const TRAINING_BREADCRUMB_LABELS: Record<string, string> = {
  '/admin/question-bank': 'Question Bank',
  '/admin/resources': 'Library & Resources',
  '/admin/attendance': 'Attendance',
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/training/programs': 'Training Programs',
  '/admin/training/cohorts': 'Cohorts',
  '/admin/training/learners': 'Learners',
  '/admin/training/trainers': 'Trainers',
  '/admin/courses': 'Course Catalog',
  '/admin/course-offerings': 'Course Offerings',
  '/admin/live-classes': 'Live Sessions',
  '/admin/assignments': 'Assignments',
  '/admin/quizzes-exams': 'Assessments',
  '/admin/students': 'Learners',
  '/admin/instructors': 'Trainers',
  '/admin/admins': 'Administrators',
  '/admin/verify-people': 'Verify People',
  '/admin/certificates': 'Certifications',
  '/admin/announcements': 'Announcements',
  '/admin/discussion-forum': 'Discussions',
  '/admin/reports': 'Reports & Analytics',
  '/admin/help-desk': 'Help Desk',
  '/admin/settings': 'Settings',
}
