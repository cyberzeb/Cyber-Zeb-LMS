import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Download,
  Grid3X3,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Palette,
  Plug,
  RefreshCcw,
  ScrollText,
  Settings,
  Shield,
  SquarePlus,
  Users,
} from 'lucide-react'
import { Sidebar } from '../../../shared/layout/Sidebar'
import { AdminFooter } from '../../../shared/layout/AdminFooter'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import brandLogo from '../../../assets/Logo.jpg'
import {
  getSuperAdminEmail,
  getSuperAdminToken,
  logoutSuperAdmin,
} from '../api/superAdminAuthApi'

const ICON_SIZE = 17

const breadcrumbLabels: Record<string, string> = {
  '/super-admin': 'Overview',
  '/super-admin/requests': 'Service Requests',
  '/super-admin/addons': 'Add-On Requests',
  '/super-admin/renewals': 'Renewals',
  '/super-admin/institutions': 'Institutions',
  '/super-admin/modules': 'Manage Modules & Pricing',
  '/super-admin/landing-content': 'Landing Page Content',
  '/super-admin/audit-logs': 'Audit Logs',
  '/super-admin/roles': 'Roles & Permissions',
  '/super-admin/settings': 'System Settings',
  '/super-admin/appearance': 'Appearance & Branding',
  '/super-admin/integrations': 'Integrations',
  '/super-admin/notifications': 'Notifications',
  '/super-admin/system-health': 'System Health',
  '/super-admin/backup': 'Backup & Restore',
  '/super-admin/security': 'Security Center',
  '/super-admin/export': 'Data Export',
  '/super-admin/analytics': 'Analytics',
}

export function SuperAdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const isLogin = path.endsWith('/login')
  const token = getSuperAdminToken()

  if (!isLogin && !token) {
    return <Navigate to="/super-admin/login" replace />
  }

  if (isLogin && token) {
    return <Navigate to="/super-admin" replace />
  }

  if (isLogin) {
    return <Outlet />
  }

  const isActive = (to: string) => {
    if (to === '/super-admin') return path === '/super-admin'
    if (to === '/super-admin/requests') {
      return path === '/super-admin/requests' || path.startsWith('/super-admin/requests/')
    }
    if (to === '/super-admin/addons') {
      return path === '/super-admin/addons' || path.startsWith('/super-admin/addons/')
    }
    if (to === '/super-admin/institutions') {
      return path === '/super-admin/institutions' || path.startsWith('/super-admin/institutions/')
    }
    return path === to || path.startsWith(`${to}/`)
  }

  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Overview',
          to: '/super-admin',
          active: isActive('/super-admin'),
          icon: <LayoutDashboard size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Requests',
      items: [
        {
          label: 'Service Requests',
          to: '/super-admin/requests',
          active: isActive('/super-admin/requests'),
          icon: <ClipboardList size={ICON_SIZE} />,
        },
        {
          label: 'Add-On Requests',
          to: '/super-admin/addons',
          active: isActive('/super-admin/addons'),
          icon: <SquarePlus size={ICON_SIZE} />,
        },
        {
          label: 'Renewals',
          to: '/super-admin/renewals',
          active: isActive('/super-admin/renewals'),
          icon: <RefreshCcw size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        {
          label: 'Institutions',
          to: '/super-admin/institutions',
          active: isActive('/super-admin/institutions'),
          icon: <Building2 size={ICON_SIZE} />,
        },
        {
          label: 'Manage Modules & Pricing',
          to: '/super-admin/modules',
          active: isActive('/super-admin/modules'),
          icon: <Grid3X3 size={ICON_SIZE} />,
        },
        {
          label: 'Landing Page Content',
          to: '/super-admin/landing-content',
          active: isActive('/super-admin/landing-content'),
          icon: <Megaphone size={ICON_SIZE} />,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Audit Logs',
          to: '/super-admin/audit-logs',
          active: isActive('/super-admin/audit-logs'),
          icon: <ScrollText size={ICON_SIZE} />,
        },
        {
          label: 'Roles & Permissions',
          to: '/super-admin/roles',
          active: isActive('/super-admin/roles'),
          icon: <Users size={ICON_SIZE} />,
        },
        {
          label: 'System Settings',
          to: '/super-admin/settings',
          active: isActive('/super-admin/settings'),
          icon: <Settings size={ICON_SIZE} />,
        },
        {
          label: 'Appearance & Branding',
          to: '/super-admin/appearance',
          active: isActive('/super-admin/appearance'),
          icon: <Palette size={ICON_SIZE} />,
        },
        {
          label: 'Integrations',
          to: '/super-admin/integrations',
          active: isActive('/super-admin/integrations'),
          icon: <Plug size={ICON_SIZE} />,
        },
        {
          label: 'Notifications',
          to: '/super-admin/notifications',
          active: isActive('/super-admin/notifications'),
          icon: <Bell size={ICON_SIZE} />,
        },
        {
          label: 'System Health',
          to: '/super-admin/system-health',
          active: isActive('/super-admin/system-health'),
          icon: <Activity size={ICON_SIZE} />,
        },
        {
          label: 'Backup & Restore',
          to: '/super-admin/backup',
          active: isActive('/super-admin/backup'),
          icon: <HardDrive size={ICON_SIZE} />,
        },
        {
          label: 'Security Center',
          to: '/super-admin/security',
          active: isActive('/super-admin/security'),
          icon: <Shield size={ICON_SIZE} />,
        },
        {
          label: 'Data Export',
          to: '/super-admin/export',
          active: isActive('/super-admin/export'),
          icon: <Download size={ICON_SIZE} />,
        },
        {
          label: 'Analytics',
          to: '/super-admin/analytics',
          active: isActive('/super-admin/analytics'),
          icon: <BarChart3 size={ICON_SIZE} />,
        },
      ],
    },
  ]

  const breadcrumb =
    breadcrumbLabels[path] ??
    (path.startsWith('/super-admin/requests/')
      ? 'Service Request'
      : path.startsWith('/super-admin/addons/')
        ? 'Add-On Request'
        : path.startsWith('/super-admin/institutions/')
          ? 'Institution'
          : 'Super Admin')

  return (
    <div className="flex h-screen app-shell-bg font-sans overflow-hidden">
      <Sidebar
        sections={navSections}
        brandLogoSrc={brandLogo}
        brandName="Berana Super Admin"
        brandSubtitle="Cyber-Zeb"
        showSystemStatus={false}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="shrink-0 h-14 bg-[#0a1020] border-b border-white/[0.08] flex items-center gap-4 px-5">
          <div className="hidden lg:flex items-center gap-2 min-w-[140px] text-[12px] text-navy-200">
            <span className="font-semibold text-white">Platform</span>
            <span className="text-white/20">/</span>
            <span>{breadcrumb}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <ThemeToggle variant="header" />
            <span className="hidden sm:inline text-[12px] text-navy-200">{getSuperAdminEmail()}</span>
            <button
              type="button"
              onClick={() => {
                logoutSuperAdmin()
                navigate('/super-admin/login')
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-danger px-3 py-2 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </header>

        <main className="page-content flex-1 min-h-0 app-scroll overflow-y-auto p-5 md:p-6">
          <div key={path} className="animate-fade-in-up max-w-6xl">
            <Outlet />
          </div>
        </main>

        <AdminFooter />
      </div>
    </div>
  )
}
