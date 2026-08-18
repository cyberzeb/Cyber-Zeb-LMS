import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, Grid3X3, LogOut, RefreshCcw, Shield, SquarePlus, type LucideIcon } from 'lucide-react'
import {
  getSuperAdminEmail,
  getSuperAdminToken,
  logoutSuperAdmin,
} from '../api/superAdminAuthApi'

const NAV_ITEMS: { path: string; label: string; Icon: LucideIcon }[] = [
  { path: '/super-admin', label: 'Service requests', Icon: ClipboardList },
  { path: '/super-admin/addons', label: 'Add-ons', Icon: SquarePlus },
  { path: '/super-admin/modules', label: 'Modules', Icon: Grid3X3 },
  { path: '/super-admin/renewals', label: 'Renewals', Icon: RefreshCcw },
]

export function SuperAdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname.endsWith('/login')
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#EEF2FF_0%,_#F7F8FC_45%,_#F3F4F8_100%)]">
      <header className="border-b border-divider bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 text-lemon-500 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-navy-900 leading-tight">
                Berana Super Admin
              </p>
              <p className="text-[12px] text-secondary-text">Cyber-Zeb platform operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {NAV_ITEMS.map(({ path, label, Icon }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-navy-900 px-3 py-2 rounded-lg hover:bg-canvas cursor-pointer"
              >
                <Icon size={15} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
            <span className="hidden sm:inline text-[12px] text-secondary-text">
              {getSuperAdminEmail()}
            </span>
            <button
              type="button"
              onClick={() => {
                logoutSuperAdmin()
                navigate('/super-admin/login')
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-danger px-3 py-2 rounded-lg hover:bg-danger-bg cursor-pointer"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
