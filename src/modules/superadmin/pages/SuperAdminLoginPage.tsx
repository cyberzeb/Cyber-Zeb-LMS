import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, Shield } from 'lucide-react'

import brandLogo from '../../../assets/Logo.jpg'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { loginSuperAdmin } from '../api/superAdminAuthApi'

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@berana.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginSuperAdmin(email.trim(), password)
      navigate('/super-admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="border-b border-divider bg-white/70 dark:bg-[#0a121e]/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={brandLogo} alt="Brana LMS" className="h-9 w-auto rounded-lg object-contain" />
            <span className="font-extrabold text-navy-900 text-[15px]">
              Brana <span className="text-lemon-700 dark:text-lemon-500">LMS</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="content" />
            <ThemeToggle variant="content" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <GlassCard className="w-full max-w-md p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-lemon-50 dark:bg-lemon-500/10 text-lemon-700 dark:text-lemon-500 flex items-center justify-center">
              <Shield size={22} strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-navy-900">Super Admin sign in</h1>
              <p className="text-[13px] text-secondary-text">
                Platform operators only
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="block text-[12px] font-bold text-navy-900 mb-1.5">Email</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute start-3.5 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none"
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@berana.com"
                  className="w-full ps-10 pe-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25 focus:border-lemon-500/50 transition-all"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-[12px] font-bold text-navy-900 mb-1.5">Password</span>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute start-3.5 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25 focus:border-lemon-500/50 transition-all"
                />
              </div>
            </label>

            {error ? (
              <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full bg-lemon-500 text-[#020810] font-bold text-[14px] py-3 rounded-xl hover:bg-lemon-200 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-[12px] text-secondary-text text-center leading-relaxed">
              Institution members sign in from the{' '}
              <Link to="/login" className="font-semibold text-navy-700 dark:text-navy-300 hover:text-lemon-700 dark:hover:text-lemon-500 transition-colors">
                portal login
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 pt-5 border-t border-divider text-center text-[12px] text-secondary-text">
            <Link to="/" className="font-semibold text-navy-700 dark:text-navy-300 hover:text-lemon-700 dark:hover:text-lemon-500 transition-colors">
              ← Back to home
            </Link>
          </p>
        </GlassCard>
      </main>
    </div>
  )
}
