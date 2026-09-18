import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { institutionTypeLabel } from '../../../shared/constants/institutionTypes'
import {
  getInstitution,
  markTenantRenewed,
  reactivateInstitution,
  resetInstitutionAdminCode,
  sendRenewalReminder,
  suspendInstitution,
} from '../api/serviceRequestApi'
import { MODULE_LABELS, type ModuleKey } from '../types'

const actionButton =
  'rounded-lg px-3.5 py-2 text-[12.5px] font-bold disabled:opacity-50 border border-divider bg-white text-navy-900 hover:bg-navy-50'

export function InstitutionDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [newCode, setNewCode] = useState<{ code: string; email: string; emailed: boolean } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'institution', id],
    queryFn: () => getInstitution(id),
    enabled: Boolean(id),
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['super-admin', 'institution', id] })
    void queryClient.invalidateQueries({ queryKey: ['super-admin', 'institutions'] })
  }
  const onError = (err: Error) => setNotice({ tone: 'error', text: err.message })

  const suspend = useMutation({
    mutationFn: () => suspendInstitution(id, suspendReason.trim()),
    onSuccess: () => {
      setSuspendReason('')
      setNotice({ tone: 'ok', text: 'Institution suspended. Its users can no longer sign in.' })
      refresh()
    },
    onError,
  })
  const reactivate = useMutation({
    mutationFn: () => reactivateInstitution(id),
    onSuccess: () => {
      setNotice({ tone: 'ok', text: 'Institution reactivated.' })
      refresh()
    },
    onError,
  })
  const renew = useMutation({
    mutationFn: () => markTenantRenewed(id),
    onSuccess: () => {
      setNotice({ tone: 'ok', text: 'Subscription renewed for one year.' })
      refresh()
    },
    onError,
  })
  const remind = useMutation({
    mutationFn: () => sendRenewalReminder(id),
    onSuccess: () => setNotice({ tone: 'ok', text: 'Renewal reminder sent to the institution admin.' }),
    onError,
  })
  const resetCode = useMutation({
    mutationFn: () => resetInstitutionAdminCode(id),
    onSuccess: (res) => {
      setNewCode({ code: res.admin_access_code, email: res.admin_email, emailed: res.email_sent })
      setNotice(null)
    },
    onError,
  })

  if (isLoading) return <p className="text-[13px] text-secondary-text">Loading…</p>
  if (error || !data) {
    return (
      <p className="text-[13px] font-semibold text-danger">
        {error instanceof Error ? error.message : 'Institution not found'}
      </p>
    )
  }

  const estimateLabel =
    data.estimated_total != null
      ? `${data.estimated_total} ${data.estimated_currency || ''}`.trim()
      : null
  const isSuspended = data.status === 'suspended'
  const busy = suspend.isPending || reactivate.isPending || renew.isPending || remind.isPending || resetCode.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900">{data.name}</h1>
          <p className="text-[13px] text-secondary-text mt-1">
            {data.slug || 'No slug'} · {institutionTypeLabel(data.institution_type)} · Admin:{' '}
            {data.admin_email || '—'}
          </p>
        </div>
        <StatusPill
          label={data.status}
          tone={data.status === 'active' ? 'success' : isSuspended || data.status === 'expired' ? 'danger' : 'neutral'}
        />
      </div>

      {notice && (
        <p
          className={`text-[13px] font-semibold px-3.5 py-2.5 rounded-lg ${
            notice.tone === 'ok' ? 'text-leaf-700 bg-lemon-50' : 'text-danger bg-danger-bg'
          }`}
        >
          {notice.text}
        </p>
      )}

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-[14px] font-extrabold text-navy-900">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <Item label="Institution type" value={institutionTypeLabel(data.institution_type)} />
          <Item
            label="Institution link"
            value={
              <a className="text-info font-semibold underline" href={data.institution_link}>
                {data.institution_link}
              </a>
            }
          />
          <Item
            label="Subscription start"
            value={
              data.subscription_start_date
                ? new Date(data.subscription_start_date).toLocaleDateString()
                : '—'
            }
          />
          <Item
            label="Renewal date"
            value={
              data.renewal_date ? new Date(data.renewal_date).toLocaleDateString() : '—'
            }
          />
          {estimateLabel && <Item label="Estimated annual" value={estimateLabel} />}
        </dl>

        <div>
          <p className="text-[12px] font-bold text-navy-900 mb-2">Enabled modules</p>
          <ul className="flex flex-wrap gap-2">
            {data.enabled_modules.map((m) => (
              <li
                key={m}
                className="text-[11.5px] font-semibold bg-lemon-50 text-navy-900 px-2.5 py-1 rounded-lg border border-lemon-500/30"
              >
                {MODULE_LABELS[m as ModuleKey] ?? m}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-5">
        <h2 className="text-[14px] font-extrabold text-navy-900">Manage institution</h2>

        <section className="space-y-2">
          <h3 className="text-[12.5px] font-bold text-navy-900">Subscription</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={actionButton} disabled={busy} onClick={() => renew.mutate()}>
              {renew.isPending ? 'Renewing…' : 'Mark renewed (+1 year)'}
            </button>
            <button type="button" className={actionButton} disabled={busy} onClick={() => remind.mutate()}>
              {remind.isPending ? 'Sending…' : 'Send renewal reminder'}
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[12.5px] font-bold text-navy-900">Institution admin access</h3>
          <p className="text-[12.5px] text-secondary-text">
            Issue a new 6-digit access code if the admin lost theirs. The old code stops working.
          </p>
          <button type="button" className={actionButton} disabled={busy} onClick={() => resetCode.mutate()}>
            {resetCode.isPending ? 'Issuing…' : 'Reset admin access code'}
          </button>
          {newCode && (
            <div className="rounded-lg border border-leaf-300 bg-white px-3 py-2">
              <p className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">
                New access code for {newCode.email}
              </p>
              <p className="mt-1 flex items-center gap-2">
                <code className="text-[18px] font-extrabold tracking-[0.3em] text-navy-900">{newCode.code}</code>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(newCode.code)}
                  className="text-[11px] font-bold text-info underline"
                >
                  Copy
                </button>
              </p>
              <p className="mt-1 text-[11.5px] text-secondary-text">
                {newCode.emailed
                  ? 'Also emailed to the admin. Shown once.'
                  : 'The email could not be sent — share this code with the admin yourself. Shown once.'}
              </p>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[12.5px] font-bold text-navy-900">
            {isSuspended ? 'Reactivate institution' : 'Suspend institution'}
          </h3>
          {isSuspended ? (
            <>
              <p className="text-[12.5px] text-secondary-text">
                All users of this institution are currently blocked.
              </p>
              <button type="button" className={actionButton} disabled={busy} onClick={() => reactivate.mutate()}>
                {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
              </button>
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-secondary-text">
                Blocks sign-in and all access for every user of this institution until reactivated.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason (required, kept in the audit log)"
                  className="flex-1 min-w-[220px] rounded-lg border border-divider bg-white px-3 py-2 text-[13px] text-navy-900"
                />
                <button
                  type="button"
                  disabled={busy || !suspendReason.trim()}
                  onClick={() => {
                    if (window.confirm(`Suspend ${data.name}? All of its users will be blocked.`)) suspend.mutate()
                  }}
                  className="rounded-lg px-3.5 py-2 text-[12.5px] font-bold text-white bg-danger disabled:opacity-50"
                >
                  {suspend.isPending ? 'Suspending…' : 'Suspend'}
                </button>
              </div>
            </>
          )}
        </section>
      </GlassCard>
    </div>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">{label}</dt>
      <dd className="text-navy-900 font-semibold mt-0.5">{value}</dd>
    </div>
  )
}
