import { BookOpen, CalendarDays, ClipboardList, GraduationCap, Headset, LayoutDashboard, LibraryBig, Megaphone, MonitorPlay, Settings, SquarePen, UserRoundCheck, Wallet, BookCheck, Users } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Sidebar } from '../../../shared/layout/Sidebar'
import { AdminTopHeader } from '../../../shared/layout/AdminTopHeader'
import { AdminFooter } from '../../../shared/layout/AdminFooter'
import brandLogo from '../../../assets/Logo.jpg'
import { PortalUserPicker } from '../../../shared/components/PortalUserPicker'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { readInstitutionName } from '../../../shared/storage/readers'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/student': 'Dashboard',
  '/student/courses': 'My Courses',
  '/student/live-classes': 'Live Classes',
  '/student/resources': 'Library',
  '/student/quizzes': 'Quizzes and Assessments',
  '/student/assignments': 'Assignment Dropboxes',
  '/student/calendar': 'Schedules and Calendars',
  '/student/grades': 'Grades and Feedback',
  '/student/attendance': 'Attendance',
  '/student/announcements': 'Announcements',
  '/student/forum': 'Discussion Forum',
  '/student/certificates': 'Certificates',
  '/student/payments': 'Payments',
  '/student/help-desk': 'Help Desk',
  '/student/settings': 'Settings',
}

export function StudentLayout() {
  const location = useLocation()
  const path = location.pathname
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const breadcrumb = path.includes('/courses/') && path.includes('/learn')
    ? 'Learning'
    : breadcrumbLabels[path] ?? 'Dashboard'

  const isForumPage = path === '/student/forum'

  if (!session || session.role !== 'Student' || !person) {
    return <PortalUserPicker role="Student" portalLabel="Student Portal" />
  }

  const isActive = (to: string) => {
    if (to === '/student') return path === '/student'
    if (to === '/student/courses') {
      return path === '/student/courses' || path === '/student/courses/'
    }
    return path === to || path.startsWith(`${to}/`)
  }

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
          label: 'Courses',
          to: '/student/courses',
          active: isActive('/student/courses'),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Live Classes',
          to: '/student/live-classes',
          active: isActive('/student/live-classes'),
          icon: <MonitorPlay size={ICON_SIZE} />,
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
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Library',
          to: '/student/resources',
          active: isActive('/student/resources'),
          icon: <LibraryBig size={ICON_SIZE} />,
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
        {
          label: 'Attendance',
          to: '/student/attendance',
          active: isActive('/student/attendance'),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Announcements',
          to: '/student/announcements',
          active: isActive('/student/announcements'),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/student/forum',
          active: isActive('/student/forum'),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Certificates',
          to: '/student/certificates',
          active: isActive('/student/certificates'),
          icon: <BookCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Payments',
          to: '/student/payments',
          active: isActive('/student/payments'),
          icon: <Wallet size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/student/help-desk',
          active: isActive('/student/help-desk'),
          icon: <Headset size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/student/settings',
          active: isActive('/student/settings'),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName="Brana LMS"
        brandSubtitle="Cyber-Zeb"
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole="Student"
          institutionName={readInstitutionName()}
          breadcrumb={breadcrumb}
        />

        <main
          ref={mainRef}
          className={`page-content flex-1 min-h-0 ${
            isForumPage
              ? 'overflow-hidden flex flex-col p-0'
              : 'app-scroll overflow-y-auto p-5 md:p-6'
          }`}
        >
          <div className={isForumPage ? 'flex-1 min-h-0 flex flex-col' : undefined}>
            <Outlet key={location.pathname} />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
