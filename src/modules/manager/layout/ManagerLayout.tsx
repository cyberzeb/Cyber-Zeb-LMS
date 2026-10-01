import { Award, BarChart3, LayoutDashboard, Megaphone, Settings, UsersRound } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import brandLogo from '../../../assets/Logo.jpg'
import { PortalAuthRedirect } from '../../../shared/components/PortalAuthRedirect'
import { AdminFooter } from '../../../shared/layout/AdminFooter'
import { AdminTopHeader } from '../../../shared/layout/AdminTopHeader'
import { Sidebar } from '../../../shared/layout/Sidebar'
import { readInstitutionName } from '../../../shared/storage/readers'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/manager': 'Dashboard',
  '/manager/team': 'My Team',
  '/manager/certifications': 'Certifications',
  '/manager/reports': 'Reports',
  '/manager/announcements': 'Announcements',
  '/manager/settings': 'Settings',
}

/** Corporate Edition: a line manager follows the training of the teams they lead. */
export function ManagerLayout() {
  const location = useLocation()
  const path = location.pathname
  const mainRef = useRef<HTMLElement>(null)
  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (!session || session.role !== 'Manager' || !person) {
    return <PortalAuthRedirect role="Manager" />
  }

  const isActive = (to: string) => (to === '/manager' ? path === to : path === to || path.startsWith(`${to}/`))
  const item = (label: string, to: string, icon: React.ReactNode) => ({ label, to, active: isActive(to), icon })

  const navSections = [
    {
      title: 'My team',
      items: [
        item('Dashboard', '/manager', <LayoutDashboard size={ICON_SIZE} />),
        item('My Team', '/manager/team', <UsersRound size={ICON_SIZE} />),
        item('Certifications', '/manager/certifications', <Award size={ICON_SIZE} />),
        item('Reports', '/manager/reports', <BarChart3 size={ICON_SIZE} />),
      ],
    },
    {
      title: 'Updates',
      items: [
        item('Announcements', '/manager/announcements', <Megaphone size={ICON_SIZE} />),
        item('Settings', '/manager/settings', <Settings size={ICON_SIZE} />),
      ],
    },
  ]

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName="Brana LMS"
        brandSubtitle="Manager Portal"
        showSystemStatus={false}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader
          userName={person.name}
          userRole="Manager"
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
