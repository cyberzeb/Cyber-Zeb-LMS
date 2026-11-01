import type { NavSection } from '../shared/layout/Sidebar'
import { Sidebar } from '../shared/layout/Sidebar'
import { AdminTopHeader } from '../shared/layout/AdminTopHeader'
import { AdminFooter } from '../shared/layout/AdminFooter'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LockedModuleGate } from '../shared/components/LockedModuleGate'
import brandLogo from '../assets/Logo.jpg'
import { canUsePortal } from '../shared/auth/portalRoutes'
import { ADMIN_ROLE_TITLES, canOpenAdminPage, isAdminPortalRole } from '../shared/auth/rolePermissions'
import { PortalAuthRedirect } from '../shared/components/PortalAuthRedirect'
import { getSessionPerson, readPortalSession } from '../shared/storage/session'
import { CampusProvider, useCampusContext } from '../modules/institution/context/CampusContext'
import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { getEditionConfig } from '../shared/config/edition'
import {
  BookCheck,
  LayoutDashboard,
  Layers,
  BookOpen,
  CalendarRange,
  CalendarDays,
  FileText,
  GraduationCap,
  ScrollText,
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
  HeartHandshake,
  Shield,
  UserCog,
  UserRoundPen,
} from 'lucide-react'

// Each destination declares the module it needs; the sidebar locks the row
// when the institution did not subscribe to it.
const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/institution/overview': 'Dashboard',
  '/admin/institution/dashboard': 'Dashboard',
  '/admin/courses': 'Course Catalog',
  '/admin/institution/departments': 'Departments',
  '/admin/institution/academic-calendar': 'Academic Calendar',
  '/admin/institution/programs': 'Academic Programs',
  '/admin/transcripts': 'Transcripts & Academic Records',
  '/admin/academic-reports': 'Academic Reports',
  '/admin/course-offerings': 'Course Offerings',
  '/admin/institution/structure': 'Organization',
  '/admin/institution/profile': 'Campus Profile',
  '/admin/students': 'Students',
  '/admin/instructors': 'Instructors',
  '/admin/teaching-assistants': 'Teaching Assistants',
  '/admin/guardians': 'Parents & Guardians',
  '/admin/admins': 'Administrators',
  '/admin/people': 'People & Users',
  '/admin/enrollments': 'Enrollments',
  '/admin/live-classes': 'Live Classes',
  '/admin/assignments': 'Assignments',
  '/admin/question-bank': 'Question Bank',
  '/admin/certificates': 'Certificates',
  '/admin/attendance': 'Attendance',
  '/admin/announcements': 'Announcements',
  '/admin/discussion-forum': 'Discussion Forum',
  '/admin/resources': 'Library & Resources',
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
  const session = readPortalSession()
  const person = getSessionPerson()
  const org = useOrganizationConfig()
  const t = org.terminology
  const mods = org.modules
  const {
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    institutionName,
  } = useCampusContext()

  if (!session || !canUsePortal('/admin', session.role) || !person || !isAdminPortalRole(session.role)) {
    return <PortalAuthRedirect role="Admin" />
  }
  const role = session.role

  // Registrars and finance officers only reach the pages of their own office.
  if (!canOpenAdminPage(role, path)) {
    return <Navigate to="/admin" replace />
  }

  const isActive = (routes: string[]) => routes.some((route) => path === route)

  // Edition-aware labels. Terminology drives the wording so the same build reads
  // "Students / Courses / Enrollments" for a university and
  // "Employees / Training Modules / Training Assignments" for a corporate tenant.
  // Departments and the programs they offer are separate pages.
  const departmentsLabel = t.departments

  const rawSections: NavSection[] = [
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
          label: t.organization,
          to: '/admin/institution/structure',
          active: isActive(['/admin/institution/structure', '/admin/institution/profile']),
          icon: <Network size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: org.edition === 'university' ? 'Academic' : 'Learning',
      items: [
        {
          label: 'Academic Calendar',
          to: '/admin/institution/academic-calendar',
          module: 'academic_structure',
          active: isActive(['/admin/institution/academic-calendar']),
          icon: <CalendarRange size={ICON_SIZE} />,
          show: mods.programs,
        },
        {
          label: departmentsLabel,
          to: '/admin/institution/departments',
          module: 'academic_structure',
          active: isActive(['/admin/institution/departments']),
          icon: <UserCog size={ICON_SIZE} />,
        },
        {
          label: t.trainingPrograms,
          to: '/admin/institution/programs',
          module: 'academic_structure',
          active: path.startsWith('/admin/institution/programs'),
          icon: <GraduationCap size={ICON_SIZE} />,
          show: mods.programs,
        },
        {
          label: t.trainingCatalog,
          to: '/admin/courses',
          module: 'course_catalog_authoring',
          active: isActive(['/admin/courses']),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: `${t.course} Offerings`,
          to: '/admin/course-offerings',
          module: 'course_catalog_authoring',
          active: isActive(['/admin/course-offerings']),
          icon: <Layers size={ICON_SIZE} />,
          show: mods.programs,
        },
        {
          label: org.edition === 'university' ? 'Live Classes' : 'Live Sessions',
          to: '/admin/live-classes',
          module: 'virtual_classroom',
          active: isActive(['/admin/live-classes']),
          icon: <MonitorPlay size={ICON_SIZE} />,
        },
        {
          label: 'Assignments',
          to: '/admin/assignments',
          module: 'assignments_assessments',
          active: isActive(['/admin/assignments']),
          icon: <SquarePen size={ICON_SIZE} />,
        },
        {
          label: 'Question Bank',
          to: '/admin/question-bank',
          module: 'assignments_assessments',
          active: isActive(['/admin/question-bank']),
          icon: <ShieldQuestion size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: t.trainingAssignment,
          to: '/admin/enrollments',
          module: 'enrollment_cohorts',
          active: isActive(['/admin/enrollments']),
          icon: <UserRoundCheck size={ICON_SIZE} />,
          show: mods.enrollments,
        },
        {
          label: 'Transcripts & Records',
          to: '/admin/transcripts',
          module: 'gradebook_progress',
          active: isActive(['/admin/transcripts']),
          icon: <ScrollText size={ICON_SIZE} />,
          show: org.edition === 'university',
        },
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
          label: 'Teaching Assistants',
          to: '/admin/teaching-assistants',
          active: isActive(['/admin/teaching-assistants']),
          icon: <UserRoundPen size={ICON_SIZE} />,
          show: org.edition === 'university',
        },
        {
          label: 'Parents & Guardians',
          to: '/admin/guardians',
          module: 'parent_manager_portal',
          active: isActive(['/admin/guardians']),
          icon: <HeartHandshake size={ICON_SIZE} />,
          show: mods.guardians,
        },
        {
          // Institution admins, registrars and finance officers.
          label: 'Administrators',
          to: '/admin/admins',
          active: isActive(['/admin/admins']),
          icon: <Shield size={ICON_SIZE} />,
        },
        {
          label: 'All People',
          to: '/admin/people',
          active: isActive(['/admin/people']),
          icon: <Users size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          label: t.certificates,
          to: '/admin/certificates',
          module: 'certificates_credentials',
          active: isActive(['/admin/certificates']),
          icon: <BookCheck size={ICON_SIZE} />,
        },
        {
          label: 'Attendance',
          to: '/admin/attendance',
          module: 'attendance',
          active: isActive(['/admin/attendance']),
          icon: <UserRoundCheck size={ICON_SIZE} />,
        },
        {
          label: 'Announcements',
          to: '/admin/announcements',
          module: 'communication_notifications',
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
          label: 'Library & Resources',
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
          module: 'payments_billing',
          active: isActive(['/admin/payments']),
          icon: <Wallet size={ICON_SIZE} />,
          show: mods.payments,
        },
        {
          label: 'Academic Reports',
          to: '/admin/academic-reports',
          module: 'reports_analytics',
          active: isActive(['/admin/academic-reports']),
          icon: <GraduationCap size={ICON_SIZE} />,
          show: org.edition === 'university',
        },
        {
          label: 'Reports & Analytics',
          to: '/admin/reports',
          module: 'reports_analytics',
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
          module: 'administration_support',
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

  // Items with `show: false` (module disabled for this edition, or a page outside
  // this role's office) and modules the institution did not buy are both
  // filtered by the sidebar itself.
  const navSections: NavSection[] = rawSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      show: item.show !== false && (!item.to || canOpenAdminPage(role, item.to)),
    })),
  }))

  const breadcrumb =
    getEditionConfig(org.edition).breadcrumbLabels[path] ??
    breadcrumbLabels[path] ??
    (path.startsWith('/admin/institution/profile') ? 'Campus Profile' : '')

  const isForumPage = path === '/admin/discussion-forum'

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
          userName={person.name}
          userRole={role === 'Admin' ? t.adminRole : ADMIN_ROLE_TITLES[role]}
          institutionName={institutionName || org.organizationName}
          breadcrumb={breadcrumb}
          campuses={mods.campuses ? campuses : []}
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
            <LockedModuleGate path={path} sections={navSections}>
              <Outlet />
            </LockedModuleGate>
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
