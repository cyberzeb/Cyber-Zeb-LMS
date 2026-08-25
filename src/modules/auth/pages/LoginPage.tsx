import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  GraduationCap,
  Headset,
  HeartHandshake,
  Mail,
  Shield,
  UserRound,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import brandLogo from '../../../assets/Logo.jpg'
import { sendLoginOtp, verifyLoginOtp } from '../../../shared/api/auth'
import { setAccessToken } from '../../../shared/api/client'
import {
  isLoginRole,
  LOGIN_ROLES,
  portalPathForRole,
  type LoginRole,
} from '../../../shared/auth/portalRoutes'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher'
import {
  DEMO_ACCOUNT_EMAILS,
  DEMO_ACCOUNTS,
  DEMO_OTP_CODE,
} from '../../../shared/data/demoAccounts'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import type { TranslationKey } from '../../../shared/i18n/translations'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { getSessionPerson, readPortalSession, writePortalSession } from '../../../shared/storage/session'

function roleIcon(role: LoginRole) {
  if (role === 'Student') return GraduationCap
  if (role === 'Guardian') return HeartHandshake
  if (role === 'HelpDesk') return Headset
  if (role === 'Admin') return Shield
  return UserRound
}

export function LoginPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role')
  const redirectTo = searchParams.get('redirect')

  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [role, setRole] = useState<LoginRole>(
    isLoginRole(initialRole) ? initialRole : 'Student',
  )
  const [email, setEmail] = useState(DEMO_ACCOUNTS[isLoginRole(initialRole) ? initialRole : 'Student'].email)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoHint, setDemoHint] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState('')

  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  const session = readPortalSession()
  const person = getSessionPerson()

  useEffect(() => {
    if (isLoginRole(initialRole)) setRole(initialRole)
  }, [initialRole])

  useEffect(() => {
    setEmail((current) => {
      if (!current.trim() || DEMO_ACCOUNT_EMAILS.has(current.trim().toLowerCase())) {
        return DEMO_ACCOUNTS[role].email
      }
      return current
    })
  }, [role])

  if (session && person) {
    const destination =
      redirectTo && redirectTo.startsWith('/') ? redirectTo : portalPathForRole(session.role)
    return <Navigate to={destination} replace />
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await sendLoginOtp(email.trim(), role)
      setSentTo(result.email)
      setDemoHint(result.demo_code ?? '000000')
      setStep('code')
      setCode(['', '', '', '', '', ''])
      setTimeout(() => codeRefs.current[0]?.focus(), 100)
    } catch {
      setError(t('login.sendError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(fullCode: string) {
    if (fullCode.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const result = await verifyLoginOtp(sentTo || email.trim(), role, fullCode)
      setAccessToken(result.access_token)
      writePortalSession({
        personId: result.person_id,
        role: result.frontend_role as LoginRole,
      })
      const destination =
        redirectTo && redirectTo.startsWith('/') ? redirectTo : portalPathForRole(role)
      navigate(destination, { replace: true })
    } catch {
      setError(t('login.verifyError'))
      setCode(['', '', '', '', '', ''])
      codeRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    if (digit && index < 5) codeRefs.current[index + 1]?.focus()
    const joined = next.join('')
    if (joined.length === 6 && next.every(Boolean)) void handleVerify(joined)
  }

  function handleCodeKeyDown(index: number, key: string) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(next)
    if (pasted.length === 6) void handleVerify(pasted)
  }

  const Icon = roleIcon(role)

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
              <Icon size={22} strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-navy-900">{t('login.title')}</h1>
              <p className="text-[13px] text-secondary-text">
                {step === 'credentials'
                  ? t('login.access', { role: t(`role.${role}` as TranslationKey) })
                  : t('login.enterCode')}
              </p>
            </div>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={(e) => void handleSendCode(e)} className="space-y-5">
              <label className="block">
                <span className="block text-[12px] font-bold text-navy-900 mb-1.5">{t('login.email')}</span>
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
                    placeholder={DEMO_ACCOUNTS[role].email}
                    className="w-full ps-10 pe-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25 focus:border-lemon-500/50 transition-all"
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-[12px] font-bold text-navy-900 mb-1.5">{t('login.signInAs')}</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as LoginRole)}
                  className="w-full px-3.5 py-2.5 text-[13.5px] input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25 cursor-pointer dark:[color-scheme:dark]"
                >
                  {LOGIN_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(`role.${r.value}` as TranslationKey)}
                    </option>
                  ))}
                </select>
              </label>

              {error ? (
                <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-lemon-500 text-[#020810] font-bold text-[14px] py-3 rounded-xl hover:bg-lemon-200 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? t('login.sending') : t('login.sendCode')}
              </button>

              <p className="text-[12px] text-secondary-text text-center leading-relaxed">
                {t('login.demoHint', { email: DEMO_ACCOUNTS[role].email, code: DEMO_OTP_CODE })}
              </p>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-[13px] text-secondary-text leading-relaxed">
                {t('login.codeSent', {
                  email: sentTo || email,
                  role: t(`role.${role}` as TranslationKey),
                })}
              </p>

              {demoHint ? (
                <p className="text-[12px] text-center bg-lemon-50 dark:bg-lemon-500/10 text-lemon-700 dark:text-lemon-500 font-semibold px-3 py-2 rounded-lg">
                  {t('login.demoCode', { code: demoHint })}
                </p>
              ) : null}

              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e.key)}
                    className="w-11 h-12 text-center text-[18px] font-bold input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/30 focus:border-lemon-500/50 transition-all"
                    aria-label={t('login.digit', { n: i + 1 })}
                  />
                ))}
              </div>

              {error ? (
                <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3.5 py-2.5 rounded-lg">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={loading || code.join('').length !== 6}
                onClick={() => void handleVerify(code.join(''))}
                className="w-full bg-[#1B2340] dark:bg-[#111b2e] text-white font-bold text-[14px] py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? t('login.verifying') : t('login.verify')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials')
                  setError(null)
                  setCode(['', '', '', '', '', ''])
                }}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-secondary-text hover:text-navy-900 transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} className="rtl:rotate-180" />
                {t('login.differentAccount')}
              </button>
            </div>
          )}

          <p className="mt-6 pt-5 border-t border-divider text-center text-[12px] text-secondary-text">
            <Link to="/" className="font-semibold text-navy-700 dark:text-navy-300 hover:text-lemon-700 dark:hover:text-lemon-500 transition-colors">
              ← {t('login.backHome')}
            </Link>
          </p>
        </GlassCard>
      </main>
    </div>
  )
}
