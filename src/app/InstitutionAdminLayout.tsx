import { Sidebar } from '../shared/layout/Sidebar'
import { AdminTopHeader } from '../shared/layout/AdminTopHeader'
import { AdminFooter } from '../shared/layout/AdminFooter'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import brandLogo from '../assets/Logo.jpg'
import { CampusProvider, useCampusContext } from '../modules/institution/context/CampusContext'
import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { getEditionConfig } from '../shared/config/edition'
import { readPeopleFromStorage } from '../modules/institution/hooks/usePeople'
import {
  countPendingVerifications,
  PEOPLE_UPDATED_EVENT,
} from '../modules/institution/utils/peopleVerification'
import {
  BookCheck,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Headset,
  Library,
  Megaphone,
  MonitorPlay,
  Network,
  Puzzle,
  Settings,
  ShieldQuestion,
  SquarePen,
  UserRoundCheck,
  UserRoundCog,
  Users,
  Wallet,
  Briefcase,
  HeartHandshake,
  Shield,
  ShieldCheck,
  UserCog,
} from 'lucide-react'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/institution/dashboard': 'Dashboard',
  '/admin/courses': 'Courses',
  '/admin/institution/programs': 'Learning Paths',
  '/admin/institution/structure': 'Organization',
  '/admin/institution/profile': 'Campus Profile',
  '/admin/students': 'Students',
  '/admin/instructors': 'Instructors',
  '/admin/staff': 'Staff',
  '/admin/guardians': 'Guardians',
  '/admin/admins': 'Administrators',
  '/admin/verify-people': 'Verify People',
  '/admin/people': 'People & Users',
  '/admin/institution/departments': 'Departments',
  '/admin/enrollments': 'Enrollments',
  '/admin/live-classes': 'Live Classes',
  '/admin/assignments': 'Assignments',
  '/admin/quizzes-exams': 'Quizzes & Exams',
  '/admin/question-bank': 'Question Bank',
  '/admin/certificates': 'Certificates',
  '/admin/attendance': 'Attendance',
  '/admin/announcements': 'Announcements',
  '/admin/discussion-forum': 'Discussion Forum',
  '/admin/resources': 'Library / Resources',
  '/admin/calendar': 'Calendar',
  '/admin/payments': 'Payments',
  '/admin/reports': 'Reports & Analytics',
  '/admin/api-integrations': 'API Integrations',
  '/admin/help-desk': 'Help Desk',
  '/admin/settings': 'Settings',
}

export function InstitutionAdminLayout() {
  return (
    <CampusProvider>
      <InstitutionAdminShell />
    </CampusProvider>
  )
}

function InstitutionAdminShell() {
  const location = useLocation()
  const path = location.pathname
  const {
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    institutionName,
  } = useCampusContext()
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const org = useOrganizationConfig()
  const t = org.terminology
  const mods = org.modules
  const edition = org.edition

  useEffect(() => {
    const refresh = () => {
      setPendingVerifications(countPendingVerifications(readPeopleFromStorage()))
    }
    refresh()
    window.addEventListener(PEOPLE_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(PEOPLE_UPDATED_EVENT, refresh)
  }, [path])

  const isActive = (routes: string[]) => routes.some((route) => path === route)

  // Section title for the learning group differs per edition.
  const learningSectionTitle =
    edition === 'corporate' ? 'Learning' : edition === 'training_organization' ? 'Training' : 'Academic'

  const liveClassesLabel = edition === 'university' ? 'Live Classes' : 'Live Training'
  const assessmentsLabel = edition === 'university' ? 'Quizzes & Exams' : 'Assessments'

  type NavEntry = {
    label: string
    to: string
    active: boolean
    icon: ReactNode
    badge?: number
    show?: boolean
  }

  const rawSections: { title: string; items: NavEntry[] }[] = [
    {
      title: 'Main',
      items: [
        {
          label: 'Dashboard',
          to: '/admin/institution/overview',
          active: isActive(['/admin', '/admin/institution/overview', '/admin/institution/dashboard']),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: `${t.organization} Structure`,
          to: '/admin/institution/structure',
          active: isActive(['/admin/institution/structure', '/admin/institution/profile']),
          icon: <Network size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: learningSectionTitle,
      items: [
        {
          label: t.departments,
          to: '/admin/institution/departments',
          active: isActive(['/admin/institution/departments']),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: t.trainingCatalog,
          to: '/admin/courses',
          active: isActive(['/admin/courses']),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: liveClassesLabel,
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
          label: assessmentsLabel,
          to: '/admin/quizzes-exams',
          active: isActive(['/admin/quizzes-exams']),
          icon: <ClipboardList size={ICON_SIZE} />,
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
          label: t.learners,
          to: '/admin/students',
          active: isActive(['/admin/students']),
          icon: <GraduationCap size={ICON_SIZE} />,
          show: mods.students,
        },
        {
          label: `${t.trainer}s`,
          to: '/admin/instructors',
          active: isActive(['/admin/instructors']),
          icon: <UserRoundCog size={ICON_SIZE} />,
          show: mods.instructors,
        },
        {
          label: t.employees,
          to: '/admin/staff',
          active: isActive(['/admin/staff']),
          icon: <Briefcase size={ICON_SIZE} />,
          show: mods.staff,
        },
        {
          label: 'Guardians',
          to: '/admin/guardians',
          active: isActive(['/admin/guardians']),
          icon: <HeartHandshake size={ICON_SIZE} />,
          show: mods.guardians,
        },
        {
          label: 'Administrators',
          to: '/admin/admins',
          active: isActive(['/admin/admins']),
          icon: <Shield size={ICON_SIZE} />,
        },
        {
          label: 'Verify People',
          to: '/admin/verify-people',
          active: isActive(['/admin/verify-people']),
          icon: <ShieldCheck size={ICON_SIZE} />,
          badge: pendingVerifications,
        },
        {
          label: 'All People',
          to: '/admin/people',
          active: isActive(['/admin/people']),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: t.trainingAssignment,
          to: '/admin/enrollments',
          active: isActive(['/admin/enrollments']),
          icon: <UserRoundCheck size={ICON_SIZE} />,
          show: mods.enrollments,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: t.certificates,
          to: '/admin/certificates',
          active: isActive(['/admin/certificates']),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Attendance',
          to: '/admin/attendance',
          active: isActive(['/admin/attendance']),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
        {
          label: 'Announcements',
          to: '/admin/announcements',
          active: isActive(['/admin/announcements']),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: edition === 'university' ? 'Discussion Forum' : 'Discussions',
          to: '/admin/discussion-forum',
          active: isActive(['/admin/discussion-forum']),
          icon: <Users size={ICON_SIZE} />,
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
          label: 'Payments',
          to: '/admin/payments',
          active: isActive(['/admin/payments']),
          icon: <Wallet size={ICON_SIZE} />,
          show: mods.payments,
        },
        {
          label: 'Reports & Analytics',
          to: '/admin/reports',
          active: isActive(['/admin/reports']),
          icon: <FileText size={ICON_SIZE} />,
        },
        {
          label: 'API Integrations',
          to: '/admin/api-integrations',
          active: isActive(['/admin/api-integrations']),
          icon: <Puzzle size={ICON_SIZE} />,
        },
        {
          label: 'Help Desk',
          to: '/admin/help-desk',
          active: isActive(['/admin/help-desk']),
          icon: <Headset size={ICON_SIZE} />,
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

  // Drop hidden items and any section left empty for this edition.
  const navSections = rawSections
    .map((section) => ({
      title: section.title,
      items: section.items.filter((item) => item.show !== false),
    }))
    .filter((section) => section.items.length > 0)

  const editionBreadcrumbs = getEditionConfig(edition).breadcrumbLabels
  const breadcrumb =
    editionBreadcrumbs[path] ??
    breadcrumbLabels[path] ??
    (path.startsWith('/admin/institution/profile') ? `${t.location} Profile` : '')

  const isForumPage = path === '/admin/discussion-forum'

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName="Berana LMS"
        brandSubtitle="Cyber-Zeb"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName="Abel Tesfaye"
          userRole={t.adminRole}
          institutionName={org.organizationName || institutionName}
          breadcrumb={breadcrumb}
          campuses={campuses}
          selectedCampusId={selectedCampusId}
          onCampusChange={setSelectedCampusId}
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