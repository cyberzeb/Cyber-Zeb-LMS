import { Sidebar } from '../shared/layout/Sidebar'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'

export function InstitutionAdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const isOverviewActive = location.pathname === '/institution/overview'
  const isCampusesActive = location.pathname === '/' || location.pathname === ''

  const linkItem = (text: string, to: string) => {
    const element = (
      <Link to={to} className="flex-1 text-inherit">
        {text}
      </Link>
    )
    const elementProps = element as unknown as {
      $$typeof: unknown
      type: unknown
      props: unknown
      ref: unknown
      _owner: unknown
      _store: unknown
    }
    return {
      $$typeof: elementProps.$$typeof,
      type: elementProps.type,
      props: elementProps.props,
      key: text,
      ref: elementProps.ref,
      _owner: elementProps._owner,
      _store: elementProps._store,
      toString: () => text,
    } as unknown as string
  }

  const navSections = [
    {
      title: 'Institution',
      items: [
        { label: linkItem('Overview', '/institution/overview'), active: isOverviewActive },
        { label: linkItem('Campuses & Colleges', '/'), active: isCampusesActive },
        { label: 'Departments' },
        { label: 'Programs' },
      ],
    },
    {
      title: 'Platform',
      items: [
        { label: 'Courses' },
        { label: 'People' },
        { label: 'Reports' },
        { label: 'Settings' },
      ],
    },
  ]

  return (
    <div
      className="flex min-h-screen bg-canvas font-sans overflow-hidden"
      onClick={(e) => {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        if (link) return

        const sidebarItem = target.closest('.cursor-pointer')
        if (sidebarItem) {
          const text = sidebarItem.textContent?.trim()
          if (text === 'Overview') {
            navigate('/institution/overview')
          } else if (text === 'Campuses & Colleges') {
            navigate('/')
          }
        }
      }}
    >
      {/* Left Sidebar */}
      <Sidebar
        sections={navSections}
        userName="Abel Tesfaye"
        userRole="Campus Director"
      />

      {/* Right Scrollable Content Area */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col p-6 md:p-8 gap-6 md:gap-8">
        {/* Breadcrumb line */}
        <div className="text-[12px] text-secondary-text font-medium tracking-wide">
          Berana University &middot; Campuses &amp; Colleges &middot; Main Campus
        </div>

        {/* Dynamic page content */}
        <Outlet />
      </main>
    </div>
  )
}
