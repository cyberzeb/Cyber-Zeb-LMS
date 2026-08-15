import { Sidebar } from '../shared/layout/Sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  BookCheck,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  Megaphone,
  MonitorPlay,
  Settings,
  ShieldQuestion,
  SquarePen,
  UserCheck,
  Users,
  UserSquare2,
} from 'lucide-react'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/institution/dashboard': 'Dashboard',
  '/admin/institution/profile': 'Campus Profile',
  '/admin/courses': 'Courses',
  '/admin/institution/programs': 'Learning Paths',
  '/admin/live-classes': 'Live Classes',
  '/admin/assignments': 'Assignments',
  '/admin/quizzes-exams': 'Quizzes & Exams',
  '/admin/question-bank': 'Question Bank',
  '/admin/students': 'Students',
  '/admin/instructors': 'Instructors',
  '/admin/institution/departments': 'Departments',
  '/admin/enrollments': 'Enrollments',
  '/admin/attendance': 'Attendance',
  '/admin/announcements': 'Announcements',
  '/admin/discussion-forum': 'Discussion Forum',
  '/admin/certificates': 'Certificates',
  '/admin/resources': 'Library / Resources',
  '/admin/calendar': 'Calendar',
  '/admin/reports': 'Reports & Analytics',
  '/admin/settings': 'Settings',
}

export function InstitutionAdminLayout() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (routes: string[]) => routes.some((route) => path === route)

  const navSections = [
    {
      title: 'Main',
      items: [
        {
          label: 'Dashboard',
          to: '/admin/institution/overview',
          active: isActive(['/admin', '/admin/institution/overview', '/admin/institution/dashboard']),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          label: 'Courses',
          to: '/admin/courses',
          active: isActive(['/admin/courses']),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Learning Paths',
          to: '/admin/institution/programs',
          active: isActive(['/admin/institution/programs']),
          icon: <FolderKanban size={ICON_SIZE} />,
        },
        {
          label: 'Live Classes',
          to: '/admin/live-classes',
          active: isActive(['/admin/live-classes']),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          active: isActive(['/admin/assignments']),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Quizzes & Exams',
          to: '/admin/quizzes-exams',
          active: isActive(['/admin/quizzes-exams']),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Question Bank',
          to: '/admin/question-bank',
          active: isActive(['/admin/question-bank']),
          icon: <ShieldQuestion size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: 'Students',
          to: '/admin/students',
          active: isActive(['/admin/students']),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
        {
          label: 'Instructors',
          to: '/admin/instructors',
          active: isActive(['/admin/instructors']),
          icon: <UserSquare2 size={ICON_SIZE} />,
        },
        {
          label: 'Departments',
          to: '/admin/institution/departments',
          active: isActive(['/admin/institution/departments']),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Enrollments',
          to: '/admin/enrollments',
          active: isActive(['/admin/enrollments']),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Attendance',
          to: '/admin/attendance',
          active: isActive(['/admin/attendance']),
          icon: <UserCheck size={ICON_SIZE} />,
        },
        {
          label: 'Announcements',
          to: '/admin/announcements',
          active: isActive(['/admin/announcements']),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/admin/discussion-forum',
          active: isActive(['/admin/discussion-forum']),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Certificates',
          to: '/admin/certificates',
          active: isActive(['/admin/certificates']),
          icon: <BookCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          label: 'Library / Resources',
          to: '/admin/resources',
          active: isActive(['/admin/resources']),
          icon: <Library size={ICON_SIZE} />,
        },
        {
          label: 'Calendar',
          to: '/admin/calendar',
          active: isActive(['/admin/calendar']),
          icon: <CalendarDays size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Institution Profile',
          to: '/admin/institution/profile',
          active: isActive(['/admin/institution/profile']),
          icon: <Library size={ICON_SIZE} />,
        },
        {
          label: 'Reports & Analytics',
          to: '/admin/reports',
          active: isActive(['/admin/reports']),
          icon: <FileSpreadsheet size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/admin/settings',
          active: isActive(['/admin/settings']),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]

  const breadcrumb = breadcrumbLabels[path] ?? ''

  return (
    <div className="flex min-h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar sections={navSections} userName="Abel Tesfaye" userRole="Institution Admin" />

      <main className="page-content app-scroll flex-1 h-screen overflow-y-auto flex flex-col p-6 md:p-8 gap-6 md:gap-8">
        <div className="rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl px-4 py-3.5 shadow-[0_10px_24px_-20px_rgba(15,33,77,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-secondary-text font-medium tracking-wide">
              <span className="text-navy-700 font-semibold">Berana University</span>
              {breadcrumb && (
                <>
                  <span className="text-navy-200">/</span>
                  <span>{breadcrumb}</span>
                </>
              )}
            </div>
            <div className="inline-flex items-center gap-2 text-[11.5px] text-navy-500 font-semibold">
              <Bell size={14} />
              Institution Notices
            </div>
          </div>
        </div>

        <div key={path} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
