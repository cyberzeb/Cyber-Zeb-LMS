/**
 * Corporate & Training edition navigation helpers for the main app.
 * These are used by CorporateAdminLayout and TrainingAdminLayout.
 */
import type { ReactNode } from 'react'
import {
  BookCheck,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  FileText,
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
  UserCog,
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
          active: isActive(['/admin/corporate/organization'], path),
          icon: <Network size={ICON_SIZE} />,
        },
        {
          label: 'Departments',
          to: '/admin/corporate/departments',
          active: isActive(['/admin/corporate/departments'], path),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: 'Teams',
          to: '/admin/corporate/teams',
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
          active: isActive(['/admin/courses'], path),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Training Assignments',
          to: '/admin/enrollments',
          active: isActive(['/admin/enrollments'], path),
          icon: <ClipboardCheck size={ICON_SIZE} />,
        },
        {
          label: 'Live Training',
          to: '/admin/live-classes',
          active: isActive(['/admin/live-classes'], path),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          active: isActive(['/admin/assignments'], path),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Assessments',
          to: '/admin/quizzes-exams',
          active: isActive(['/admin/quizzes-exams'], path),
          icon: <ClipboardList size={ICON_SIZE} />,
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
          active: isActive(['/admin/corporate/job-roles'], path),
          icon: <Briefcase size={ICON_SIZE} />,
        },
        {
          label: 'Skills',
          to: '/admin/corporate/skills',
          active: isActive(['/admin/corporate/skills'], path),
          icon: <Sparkles size={ICON_SIZE} />,
        },
        {
          label: 'Compliance',
          to: '/admin/corporate/compliance',
          active: isActive(['/admin/corporate/compliance'], path),
          icon: <ShieldCheck size={ICON_SIZE} />,
        },
        {
          label: 'Certifications',
          to: '/admin/certificates',
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
          active: isActive(['/admin/announcements'], path),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/admin/discussion-forum',
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
          active: isActive(['/admin/reports'], path),
          icon: <FileText size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/admin/help-desk',
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
          to: '/admin/courses',
          active: isActive(['/admin/courses'], path),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Course Offerings',
          to: '/admin/course-offerings',
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
          active: isActive(['/admin/live-classes'], path),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          active: isActive(['/admin/assignments'], path),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Assessments',
          to: '/admin/quizzes-exams',
          active: isActive(['/admin/quizzes-exams'], path),
          icon: <ClipboardList size={ICON_SIZE} />,
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
          active: isActive(['/admin/certificates'], path),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Announcements',
          to: '/admin/announcements',
          active: isActive(['/admin/announcements'], path),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/admin/discussion-forum',
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
          active: isActive(['/admin/reports'], path),
          icon: <FileText size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/admin/help-desk',
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
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/courses': 'Training Programs',
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
