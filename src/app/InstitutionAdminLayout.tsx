import { Sidebar } from '../shared/layout/Sidebar'
import { AdminTopHeader } from '../shared/layout/AdminTopHeader'
import { AdminFooter } from '../shared/layout/AdminFooter'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import brandLogo from '../assets/Logo.jpg'
import { CampusProvider, useCampusContext } from '../modules/institution/context/CampusContext'
import { DarkModeToggle } from '../shared/components/DarkModeToggle'
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

  useEffect(() => {
    const refresh = () => {
      setPendingVerifications(countPendingVerifications(readPeopleFromStorage()))
    }
    refresh()
    window.addEventListener(PEOPLE_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(PEOPLE_UPDATED_EVENT, refresh)
  }, [path])

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
        {
          label: 'Organization',
          to: '/admin/institution/structure',
          active: isActive(['/admin/institution/structure', '/admin/institution/profile']),
          icon: <Network size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          label: 'Departments',
          to: '/admin/institution/departments',
          active: isActive(['/admin/institution/departments']),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: 'Courses',
          to: '/admin/courses',
          active: isActive(['/admin/courses']),
          icon: <BookOpen size={ICON_SIZE} />,
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
          label: 'Students',
          to: '/admin/students',
          active: isActive(['/admin/students']),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
        {
          label: 'Instructors',
          to: '/admin/instructors',
          active: isActive(['/admin/instructors']),
          icon: <UserRoundCog size={ICON_SIZE} />,
        },
        {
          label: 'Staff',
          to: '/admin/staff',
          active: isActive(['/admin/staff']),
          icon: <Briefcase size={ICON_SIZE} />,
        },
        {
          label: 'Guardians',
          to: '/admin/guardians',
          active: isActive(['/admin/guardians']),
          icon: <HeartHandshake size={ICON_SIZE} />,
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
          label: 'Enrollments',
          to: '/admin/enrollments',
          active: isActive(['/admin/enrollments']),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: 'Certificates',
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
          label: 'Discussion Forum',
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

  const breadcrumb =
    breadcrumbLabels[path] ??
    (path.startsWith('/admin/institution/profile') ? 'Campus Profile' : '')

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName="Brana LMS"
        brandSubtitle="Cyber-Zeb"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName="Abel Tesfaye"
          userRole="Institution Admin"
          institutionName={institutionName}
          breadcrumb={breadcrumb}
          campuses={campuses}
          selectedCampusId={selectedCampusId}
          onCampusChange={setSelectedCampusId}
          extraActions={<DarkModeToggle variant="icon" />}
        />

        <main className="page-content app-scroll flex-1 overflow-y-auto p-5 md:p-6">
          <div key={path} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
