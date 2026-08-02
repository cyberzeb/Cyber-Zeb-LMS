import { Sidebar } from '../shared/layout/Sidebar'
import { Outlet, useLocation } from 'react-router-dom'

const breadcrumbLabels: Record<string, string> = {
  '/': 'Campuses & Colleges · Main Campus',
  '/institution/overview': 'Overview',
  '/institution/departments': 'Departments',
  '/institution/programs': 'Academic Programs',
  '/courses': 'Course Catalog',
  '/people': 'People & Users',
  '/reports': 'Reports & Analytics',
  '/settings': 'Institution Settings',
}

export function InstitutionAdminLayout() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (to: string) =>
    to === '/' ? path === '/' || path === '' : path === to

  const navSections = [
    {
      title: 'Institution',
      items: [
        { label: 'Overview', to: '/institution/overview', active: isActive('/institution/overview') },
        { label: 'Campuses & Colleges', to: '/', active: isActive('/') },
        { label: 'Departments', to: '/institution/departments', active: isActive('/institution/departments') },
        { label: 'Programs', to: '/institution/programs', active: isActive('/institution/programs') },
      ],
    },
    {
      title: 'Platform',
      items: [
        { label: 'Courses', to: '/courses', active: isActive('/courses') },
        { label: 'People', to: '/people', active: isActive('/people') },
        { label: 'Reports', to: '/reports', active: isActive('/reports') },
        { label: 'Settings', to: '/settings', active: isActive('/settings') },
      ],
    },
  ]

  const breadcrumb = breadcrumbLabels[path] ?? ''

  return (
    <div className="flex min-h-screen bg-canvas font-sans overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar sections={navSections} userName="Abel Tesfaye" userRole="Institution Admin" />

      {/* Right Scrollable Content Area */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col p-6 md:p-8 gap-6 md:gap-8">
        {/* Breadcrumb line */}
        <div className="text-[12px] text-secondary-text font-medium tracking-wide">
          Berana University{breadcrumb ? ` · ${breadcrumb}` : ''}
        </div>

        {/* Dynamic page content */}
        <Outlet />
      </main>
    </div>
  )
}
