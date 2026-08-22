import {
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Settings,
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
  '/guardian': 'Dashboard',
  '/guardian/progress': 'Student Progress',
  '/guardian/announcements': 'Announcements',
  '/guardian/settings': 'Settings',
}

export function GuardianLayout() {
  const location = useLocation()
  const path = location.pathname
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (!session || session.role !== 'Guardian' || !person) {
    return <PortalUserPicker role="Guardian" portalLabel="Guardian Portal" adminSetupHref="/admin/guardians" />
  }

  const isActive = (to: string) => {
    if (to === '/guardian') return path === '/guardian'
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = [
    {
      title: 'Family',
      items: [
        {
          label: 'Dashboard',
          to: '/guardian',
          active: isActive('/guardian'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Student Progress',
          to: '/guardian/progress',
          active: isActive('/guardian/progress'),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Updates',
      items: [
        {
          label: 'Announcements',
          to: '/guardian/announcements',
          active: isActive('/guardian/announcements'),
          icon: <Megaphone size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/guardian/settings',
          active: isActive('/guardian/settings'),
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
        brandSubtitle="Guardian Portal"
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole="Guardian"
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
