import { Sidebar } from '../shared/layout/Sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Boxes,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/admin': 'Campuses & Colleges · Main Campus',
  '/admin/institution/overview': 'Overview',
  '/admin/institution/departments': 'Departments',
  '/admin/institution/programs': 'Academic Programs',
  '/admin/courses': 'Course Catalog',
  '/admin/people': 'People & Users',
  '/admin/reports': 'Reports & Analytics',
  '/admin/settings': 'Institution Settings',
}

export function InstitutionAdminLayout() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (to: string) =>
    to === '/admin' ? path === '/admin' || path === '/admin/' : path === to

  const navSections = [
    {
      title: 'Institution',
      items: [
        {
          label: 'Overview',
          to: '/admin/institution/overview',
          active: isActive('/admin/institution/overview'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
        {
          label: 'Campuses & Colleges',
          to: '/admin',
          active: isActive('/admin'),
          icon: <Building2 size={ICON_SIZE} />,
        },
        {
          label: 'Departments',
          to: '/admin/institution/departments',
          active: isActive('/admin/institution/departments'),
          icon: <Boxes size={ICON_SIZE} />,
        },
        {
          label: 'Programs',
          to: '/admin/institution/programs',
          active: isActive('/admin/institution/programs'),
          icon: <GraduationCap size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        {
          label: 'Courses',
          to: '/admin/courses',
          active: isActive('/admin/courses'),
          icon: <BookOpen size={ICON_SIZE} />,
        },
        {
          label: 'People',
          to: '/admin/people',
          active: isActive('/admin/people'),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'Reports',
          to: '/admin/reports',
          active: isActive('/admin/reports'),
          icon: <BarChart3 size={ICON_SIZE} />,
        },
        {
          label: 'Settings',
          to: '/admin/settings',
          active: isActive('/admin/settings'),
          icon: <Settings size={ICON_SIZE} />,
        },
      ],
    },
  ]

  const breadcrumb = breadcrumbLabels[path] ?? ''

  return (
    <div className="flex min-h-screen app-shell-bg font-sans overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar sections={navSections} userName="Abel Tesfaye" userRole="Institution Admin" />

      {/* Right Scrollable Content Area */}
      <main className="page-content app-scroll flex-1 h-screen overflow-y-auto flex flex-col p-6 md:p-8 gap-6 md:gap-8">
        {/* Breadcrumb line */}
        <div className="flex items-center gap-1.5 text-[12px] text-secondary-text font-medium tracking-wide">
          <span className="text-navy-700 font-semibold">Berana University</span>
          {breadcrumb && (
            <>
              <span className="text-navy-200">/</span>
              <span>{breadcrumb}</span>
            </>
          )}
        </div>

        {/* Dynamic page content */}
        <div key={path} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
