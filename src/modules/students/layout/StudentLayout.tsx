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
  Wallet,
  BookCheck,
  Users,
} from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef } from 'react'
import { Sidebar } from '../../../shared/layout/Sidebar'
import { AdminTopHeader } from '../../../shared/layout/AdminTopHeader'
import { AdminFooter } from '../../../shared/layout/AdminFooter'
import brandLogo from '../../../assets/Logo.jpg'
import { PortalAuthRedirect } from '../../../shared/components/PortalAuthRedirect'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'
import { readInstitutionName } from '../../../shared/storage/readers'
import { useLearnerBasePath } from '../../../shared/hooks/useLearnerBasePath'
import { getTerminology } from '../../../shared/config/terminology'

const ICON_SIZE = 17

const universityBreadcrumbs: Record<string, string> = {
  '/student': 'Dashboard',
  '/student/courses': 'My Courses',
  '/student/live-classes': 'Live Classes',
  '/student/resources': 'Course Content & Resources',
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

function employeeBreadcrumbs(base: '/employee'): Record<string, string> {
  return {
    [base]: 'Dashboard',
    [`${base}/courses`]: 'My Training',
    [`${base}/live-classes`]: 'Live Training',
    [`${base}/resources`]: 'Training Resources',
    [`${base}/quizzes`]: 'Assessments',
    [`${base}/assignments`]: 'Training Tasks',
    [`${base}/calendar`]: 'Schedule',
    [`${base}/announcements`]: 'Announcements',
    [`${base}/forum`]: 'Discussions',
    [`${base}/certificates`]: 'Certifications',
    [`${base}/help-desk`]: 'Help Desk',
    [`${base}/settings`]: 'Settings',
  }
}

export function StudentLayout() {
  const location = useLocation()
  const path = location.pathname
  const basePath = useLearnerBasePath()
  const isEmployeePortal = basePath === '/employee'
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()
  const t = getTerminology()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const breadcrumbLabels = useMemo(
    () => (isEmployeePortal ? employeeBreadcrumbs('/employee') : universityBreadcrumbs),
    [isEmployeePortal],
  )

  const breadcrumb = path.includes('/courses/') && path.includes('/learn')
    ? isEmployeePortal ? 'Training' : 'Learning'
    : breadcrumbLabels[path] ?? 'Dashboard'

  const isForumPage = path === `${basePath}/forum`

  if (!session || session.role !== 'Student' || !person) {
    return <PortalAuthRedirect role="Student" />
  }

  const isActive = (to: string) => {
    if (to === basePath) return path === basePath
    if (to === `${basePath}/courses`) {
      return path === `${basePath}/courses` || path === `${basePath}/courses/`
    }
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = isEmployeePortal
    ? [
        {
          title: 'Learning',
          items: [
            {
              label: 'Dashboard',
              to: basePath,
              active: isActive(basePath),
              icon: <LayoutDashboard size={ICON_SIZE} />,
            },
            {
              label: 'My Training',
              to: `${basePath}/courses`,
              active: isActive(`${basePath}/courses`),
              icon: <BookOpen size={ICON_SIZE} />,
            },
            {
              label: 'Live Training',
              to: `${basePath}/live-classes`,
              active: isActive(`${basePath}/live-classes`),
              icon: <MonitorPlay size={ICON_SIZE} />,
            },
            {
              label: 'Assessments',
              to: `${basePath}/quizzes`,
              active: isActive(`${basePath}/quizzes`),
              icon: <ClipboardList size={ICON_SIZE} />,
            },
            {
              label: 'Training Tasks',
              to: `${basePath}/assignments`,
              active: isActive(`${basePath}/assignments`),
              icon: <SquarePen size={ICON_SIZE} />,
            },
            {
              label: 'Resources',
              to: `${basePath}/resources`,
              active: isActive(`${basePath}/resources`),
              icon: <LibraryBig size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Schedule',
          items: [
            {
              label: 'Calendar',
              to: `${basePath}/calendar`,
              active: isActive(`${basePath}/calendar`),
              icon: <CalendarDays size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Engagement',
          items: [
            {
              label: 'Announcements',
              to: `${basePath}/announcements`,
              active: isActive(`${basePath}/announcements`),
              icon: <Megaphone size={ICON_SIZE} />,
            },
            {
              label: 'Discussions',
              to: `${basePath}/forum`,
              active: isActive(`${basePath}/forum`),
              icon: <Users size={ICON_SIZE} />,
            },
            {
              label: 'Certifications',
              to: `${basePath}/certificates`,
              active: isActive(`${basePath}/certificates`),
              icon: <BookCheck size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Account',
          items: [
            {
              label: 'Help Desk',
              to: `${basePath}/help-desk`,
              active: isActive(`${basePath}/help-desk`),
              icon: <Headset size={ICON_SIZE} />,
            },
            {
              label: 'Settings',
              to: `${basePath}/settings`,
              active: isActive(`${basePath}/settings`),
              icon: <Settings size={ICON_SIZE} />,
            },
          ],
        },
      ]
    : [
        {
          title: 'Learning',
          items: [
            {
              label: 'Dashboard',
              to: basePath,
              active: isActive(basePath),
              icon: <LayoutDashboard size={ICON_SIZE} />,
            },
            {
              label: 'Courses',
              to: `${basePath}/courses`,
              active: isActive(`${basePath}/courses`),
              icon: <BookOpen size={ICON_SIZE} />,
            },
            {
              label: 'Live Classes',
              to: `${basePath}/live-classes`,
              active: isActive(`${basePath}/live-classes`),
              icon: <MonitorPlay size={ICON_SIZE} />,
            },
            {
              label: 'Quizzes',
              to: `${basePath}/quizzes`,
              active: isActive(`${basePath}/quizzes`),
              icon: <ClipboardList size={ICON_SIZE} />,
            },
            {
              label: 'Assignments',
              to: `${basePath}/assignments`,
              active: isActive(`${basePath}/assignments`),
              icon: <SquarePen size={ICON_SIZE} />,
            },
            {
              label: 'Resources',
              to: `${basePath}/resources`,
              active: isActive(`${basePath}/resources`),
              icon: <LibraryBig size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Performance',
          items: [
            {
              label: 'Calendar',
              to: `${basePath}/calendar`,
              active: isActive(`${basePath}/calendar`),
              icon: <CalendarDays size={ICON_SIZE} />,
            },
            {
              label: 'Grades',
              to: `${basePath}/grades`,
              active: isActive(`${basePath}/grades`),
              icon: <GraduationCap size={ICON_SIZE} />,
            },
            {
              label: 'Attendance',
              to: `${basePath}/attendance`,
              active: isActive(`${basePath}/attendance`),
              icon: <UserRoundCheck size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Engagement',
          items: [
            {
              label: 'Announcements',
              to: `${basePath}/announcements`,
              active: isActive(`${basePath}/announcements`),
              icon: <Megaphone size={ICON_SIZE} />,
            },
            {
              label: 'Discussion Forum',
              to: `${basePath}/forum`,
              active: isActive(`${basePath}/forum`),
              icon: <Users size={ICON_SIZE} />,
            },
            {
              label: 'Certificates',
              to: `${basePath}/certificates`,
              active: isActive(`${basePath}/certificates`),
              icon: <BookCheck size={ICON_SIZE} />,
            },
          ],
        },
        {
          title: 'Account',
          items: [
            {
              label: 'Payments',
              to: `${basePath}/payments`,
              active: isActive(`${basePath}/payments`),
              icon: <Wallet size={ICON_SIZE} />,
            },
            {
              label: 'Help Desk',
              to: `${basePath}/help-desk`,
              active: isActive(`${basePath}/help-desk`),
              icon: <Headset size={ICON_SIZE} />,
            },
            {
              label: 'Settings',
              to: `${basePath}/settings`,
              active: isActive(`${basePath}/settings`),
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
        brandName={readInstitutionName()}
        brandSubtitle={isEmployeePortal ? 'Employee Portal' : 'Cyber-Zeb'}
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole={isEmployeePortal ? t.employee : 'Student'}
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
