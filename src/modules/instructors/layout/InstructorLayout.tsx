import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Headset,
  LayoutDashboard,
  LibraryBig,
  Megaphone,
  MonitorPlay,
  Settings,
  SquarePen,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../../../shared/layout/Sidebar'
import { AdminTopHeader } from '../../../shared/layout/AdminTopHeader'
import { AdminFooter } from '../../../shared/layout/AdminFooter'
import brandLogo from '../../../assets/Logo.jpg'
import { PortalUserPicker } from '../../../shared/components/PortalUserPicker'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { readInstitutionName } from '../../../shared/storage/readers'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/instructor': 'Dashboard',
  '/instructor/courses': 'My Courses',
  '/instructor/students': 'Student Roster',
  '/instructor/live-classes': 'Live Classes',
  '/instructor/resources': 'Course Content & Resources',
  '/instructor/quizzes': 'Quizzes and Assessments',
  '/instructor/assignments': 'Assignment Submissions',
  '/instructor/calendar': 'Schedules and Calendars',
  '/instructor/grades': 'Gradebook',
  '/instructor/attendance': 'Attendance',
  '/instructor/announcements': 'Announcements',
  '/instructor/forum': 'Discussion Forum',
  '/instructor/help-desk': 'Help Desk',
  '/instructor/settings': 'Settings',
}

export function InstructorLayout() {
  const location = useLocation()
  const path = location.pathname
  const session = readPortalSession()
  const person = getSessionPerson()

  if (!session || session.role !== 'Instructor' || !person) {
    return <PortalUserPicker role="Instructor" portalLabel="Instructor Portal" />
  }

  const isActive = (to: string) => {
    if (to === '/instructor') return path === '/instructor'
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = [
    {
      title: 'Teaching',
      items: [
        {
          label: 'Dashboard',
          to: '/instructor',
          active: isActive('/instructor'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Courses',
          to: '/instructor/courses',
          active: isActive('/instructor/courses'),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'Students',
          to: '/instructor/students',
          active: isActive('/instructor/students'),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Live Classes',
          to: '/instructor/live-classes',
          active: isActive('/instructor/live-classes'),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Quizzes',
          to: '/instructor/quizzes',
          active: isActive('/instructor/quizzes'),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/instructor/assignments',
          active: isActive('/instructor/assignments'),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Resources',
          to: '/instructor/resources',
          active: isActive('/instructor/resources'),
          icon: <LibraryBig size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Assessment',
      items: [
        {
          label: 'Calendar',
          to: '/instructor/calendar',
          active: isActive('/instructor/calendar'),
          icon: <CalendarDays size={ICON_SIZE} />,
        },
        {
          label: 'Gradebook',
          to: '/instructor/grades',
          active: isActive('/instructor/grades'),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
        {
          label: 'Attendance',
          to: '/instructor/attendance',
          active: isActive('/instructor/attendance'),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Announcements',
          to: '/instructor/announcements',
          active: isActive('/instructor/announcements'),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Discussion Forum',
          to: '/instructor/forum',
          active: isActive('/instructor/forum'),
          icon: <Users size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Help Desk',
          to: '/instructor/help-desk',
          active: isActive('/instructor/help-desk'),
          icon: <Headset size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/instructor/settings',
          active: isActive('/instructor/settings'),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]

  const breadcrumb = breadcrumbLabels[path] ?? 'Dashboard'
  const isForumPage = path === '/instructor/forum'

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
          userRole="Instructor"
          institutionName={readInstitutionName()}
          breadcrumb={breadcrumb}
        />

        <main
          className={`page-content flex-1 min-h-0 ${
            isForumPage
              ? 'overflow-hidden flex flex-col p-0'
              : 'app-scroll overflow-y-auto p-5 md:p-6'
          }`}
        >
          <div
            key={path}
            className={isForumPage ? 'flex-1 min-h-0 flex flex-col' : 'animate-fade-in-up'}
          >
            <Outlet />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
