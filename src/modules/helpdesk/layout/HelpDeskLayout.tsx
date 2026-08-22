import { LayoutDashboard, MessageCircle, Settings } from 'lucide-react'
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
  '/help-desk': 'Dashboard',
  '/help-desk/tickets': 'Support Tickets',
  '/help-desk/settings': 'Settings',
}

export function HelpDeskLayout() {
  const location = useLocation()
  const path = location.pathname
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (!session || session.role !== 'HelpDesk' || !person) {
    return (
      <PortalUserPicker
        role="HelpDesk"
        portalLabel="Help Desk Portal"
        adminSetupHref="/admin/people"
      />
    )
  }

  const isActive = (to: string) => {
    if (to === '/help-desk') return path === '/help-desk'
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = [
    {
      title: 'Support',
      items: [
        {
          label: 'Dashboard',
          to: '/help-desk',
          active: isActive('/help-desk'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Tickets',
          to: '/help-desk/tickets',
          active: isActive('/help-desk/tickets'),
          icon: <MessageCircle size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Settings',
          to: '/help-desk/settings',
          active: isActive('/help-desk/settings'),
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
        brandSubtitle="Help Desk"
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole="Help Desk Agent"
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
