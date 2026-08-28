import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { loginSuperAdmin } from '../api/superAdminAuthApi'

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('mekashabetel@gmail.com')
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_#EEF2FF_0%,_#F7F8FC_50%,_#E8ECF4_100%)]">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-[22px] font-extrabold text-navy-900">Super Admin sign in</h1>
        <p className="mt-1.5 text-[13px] text-secondary-text">
          Platform operators only. Institution admins use a separate login.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-[12px] font-bold text-navy-900 mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[13.5px] border border-divider rounded-lg px-3.5 py-2.5 outline-none focus:border-lemon-500"
              required
            />
          </label>
          <label className="block">
            <span className="block text-[12px] font-bold text-navy-900 mb-1.5">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[13.5px] border border-divider rounded-lg px-3.5 py-2.5 outline-none focus:border-lemon-500"
              required
            />
          </label>
          {error && (
            <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
