import {
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserPlus,
} from 'lucide-react'
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
  '/staff': 'Dashboard',
  '/staff/submit-people': 'Submit People',
  '/staff/announcements': 'Announcements',
  '/staff/settings': 'Settings',
}

export function StaffLayout() {
  const location = useLocation()
  const path = location.pathname
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (!session || session.role !== 'Staff' || !person) {
    return <PortalUserPicker role="Staff" portalLabel="Staff Portal" adminSetupHref="/admin/staff" />
  }

  const isActive = (to: string) => {
    if (to === '/staff') return path === '/staff'
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          label: 'Dashboard',
          to: '/staff',
          active: isActive('/staff'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Submit People',
          to: '/staff/submit-people',
          active: isActive('/staff/submit-people'),
          icon: <UserPlus size={ICON_SIZE} />,
        },
        {
          label: 'My Submissions',
          to: '/staff/submissions',
          active: isActive('/staff/submissions'),
          icon: <ClipboardCheck size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Campus',
      items: [
        {
          label: 'Announcements',
          to: '/staff/announcements',
          active: isActive('/staff/announcements'),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/staff/settings',
          active: isActive('/staff/settings'),
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
        brandSubtitle={`Staff · ${person.department}`}
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole={`Staff · ${person.department}`}
          institutionName={readInstitutionName()}
          breadcrumb={breadcrumbLabels[path] ?? 'Dashboard'}
        />

        <main ref={mainRef} className="page-content flex-1 min-h-0 app-scroll overflow-y-auto p-5 md:p-6">
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
