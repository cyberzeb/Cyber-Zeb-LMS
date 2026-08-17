import { BookOpen, CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, LibraryBig } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../../../shared/layout/Sidebar'
import brandLogo from '../../../assets/Logo.jpg'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/student': 'Dashboard',
  '/student/resources': 'Course Content & Resources',
  '/student/quizzes': 'Quizzes and Assessments',
  '/student/assignments': 'Assignment Dropboxes',
  '/student/calendar': 'Schedules and Calendars',
  '/student/grades': 'Grades and Feedback',
}

export function StudentLayout() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (to: string) => path === to || path.startsWith(`${to}/`)

  const navSections = [
    {
      title: 'Learning',
      items: [
        {
          label: 'Dashboard',
          to: '/student',
          active: isActive('/student'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Resources',
          to: '/student/resources',
          active: isActive('/student/resources'),
          icon: <LibraryBig size={ICON_SIZE} />,
        },
        {
          label: 'Quizzes',
          to: '/student/quizzes',
          active: isActive('/student/quizzes'),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/student/assignments',
          active: isActive('/student/assignments'),
          icon: <BookOpen size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Performance',
      items: [
        {
          label: 'Calendar',
          to: '/student/calendar',
          active: isActive('/student/calendar'),
          icon: <CalendarDays size={ICON_SIZE} />,
        },
        {
          label: 'Grades',
          to: '/student/grades',
          active: isActive('/student/grades'),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
      ],
    },
  ]

  const breadcrumb = breadcrumbLabels[path] ?? 'Dashboard'

  return (
    <div className="flex min-h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        userName="Amina Lemma"
        userRole="Student"
        brandLogoSrc={brandLogo}
        brandName="Berana LMS"
        brandSubtitle="Cyber-Zeb"
      />
      <main className="page-content app-scroll flex-1 h-screen overflow-y-auto flex flex-col p-6 md:p-8 gap-6 md:gap-8">
        <div className="flex items-center gap-1.5 text-[12px] text-secondary-text font-medium tracking-wide">
          <span className="text-navy-700 font-semibold">Student Portal</span>
          <span className="text-navy-200">/</span>
          <span>{breadcrumb}</span>
        </div>

        <div key={path} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
