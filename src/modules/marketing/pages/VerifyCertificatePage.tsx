/**
 * Public certificate verification — where the QR code and share links lead.
 * Anyone can check that a certificate is genuine and still valid, no sign-in.
 */
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, CircleAlert, Clock, Loader2, Search, ShieldX } from 'lucide-react'

import brandLogo from '../../../assets/Logo.jpg'
import { axiosClient } from '../../../lib/axiosClient'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'

interface Verification {
  found: boolean
  certificate_id: string
  status: string | null
  valid: boolean
  expired: boolean
  student_name: string | null
  course_code: string | null
  course_title: string | null
  institution_name: string | null
  issue_date: string | null
  completion_date: string | null
  expiration_date: string | null
  revoked_at: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function VerifyCertificatePage() {
  const { certificateId = '' } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(certificateId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-certificate', certificateId],
    enabled: Boolean(certificateId),
    retry: false,
    queryFn: async () => {
      const { data } = await axiosClient.get<Verification>(
        `/public/certificates/${encodeURIComponent(certificateId)}`,
      )
      return data
    },
  })

  function lookup(e: FormEvent) {
    e.preventDefault()
    const id = input.trim()
    if (id) navigate(`/verify/${encodeURIComponent(id)}`)
  }

  return (
    <div className="marketing-page font-sans min-h-screen flex flex-col">
      <header className="border-b border-divider">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={brandLogo} alt="Brana LMS" className="h-9 w-auto rounded-lg object-contain" />
            <span className="font-extrabold text-[15px] marketing-section-heading">
              Brana <span className="text-lemon-700 dark:text-lemon-500">LMS</span>
            </span>
          </Link>
          <ThemeToggle variant="content" />
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-xl mx-auto">
          <span className="marketing-accent-label">Certificate verification</span>
          <h1 className="mt-3 text-[28px] marketing-section-heading">Is this certificate genuine?</h1>
          <p className="mt-2 text-[14px] marketing-body-text">
            Enter the certificate ID printed on the certificate, or scan its QR code.
          </p>

          <form onSubmit={lookup} className="mt-6 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. BER-CERT-2026-00001"
              className="flex-1 px-3.5 py-2.5 text-[14px] font-mono input-surface rounded-xl outline-none focus:ring-2 focus:ring-lemon-500/25"
              aria-label="Certificate ID"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-5 py-2.5 text-[13.5px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors cursor-pointer"
            >
              <Search size={15} /> Verify
            </button>
          </form>

          <div className="mt-8">
            {!certificateId ? null : isLoading ? (
              <p className="flex items-center gap-2 text-[14px] marketing-body-text">
                <Loader2 size={16} className="animate-spin" /> Checking…
              </p>
            ) : error ? (
              <Result tone="warn" icon={<CircleAlert size={22} />} title="We could not check this right now">
                {error instanceof Error ? error.message : 'Please try again in a moment.'}
              </Result>
            ) : data && !data.found ? (
              <Result tone="bad" icon={<ShieldX size={22} />} title="No certificate found">
                There is no awarded certificate with the ID <strong className="font-mono">{certificateId}</strong>.
                Check the ID for typos. A certificate that is still being processed will not appear here.
              </Result>
            ) : data ? (
              <Result
                tone={data.valid ? 'good' : data.status === 'revoked' ? 'bad' : 'warn'}
                icon={data.valid ? <BadgeCheck size={22} /> : data.status === 'revoked' ? <ShieldX size={22} /> : <Clock size={22} />}
                title={
                  data.valid
                    ? 'Valid certificate'
                    : data.status === 'revoked'
                      ? 'This certificate has been revoked'
                      : 'This certificate has expired'
                }
              >
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Item label="Awarded to" value={data.student_name ?? '—'} />
                  <Item label="Issued by" value={data.institution_name ?? '—'} />
                  <Item label="Course" value={[data.course_code, data.course_title].filter(Boolean).join(' — ') || '—'} />
                  <Item label="Certificate ID" value={data.certificate_id} mono />
                  <Item label="Issue date" value={formatDate(data.issue_date)} />
                  {data.expiration_date ? <Item label="Valid until" value={formatDate(data.expiration_date)} /> : null}
                  {data.revoked_at ? <Item label="Revoked on" value={formatDate(data.revoked_at)} /> : null}
                </dl>
              </Result>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

function Result({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'good' | 'bad' | 'warn'
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  const styles = {
    good: 'border-success/40 bg-success-bg text-success',
    bad: 'border-danger/40 bg-danger-bg text-danger',
    warn: 'border-warning/40 bg-warning-bg text-[#8A6D00] dark:text-warning',
  }[tone]
  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-[18px] font-extrabold">{title}</h2>
      </div>
      <div className="mt-2 text-[13.5px] marketing-body-text">{children}</div>
    </div>
  )
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide marketing-body-text opacity-80">{label}</dt>
      <dd className={`mt-0.5 text-[14px] font-semibold marketing-section-heading ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  )
}
