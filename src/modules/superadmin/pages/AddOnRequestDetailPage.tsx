import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import {
  activateAddOnRequest,
  confirmAddOnPayment,
  getAddOnRequest,
  resendAddOnRequestEmail,
  sendAddOnInvoice,
} from '../api/serviceRequestApi'
import { MODULE_LABELS, STATUS_LABELS, type ModuleKey, type ServiceRequestStatus } from '../types'

function statusTone(status: ServiceRequestStatus): StatusTone {
  switch (status) {
    case 'new':
      return 'info'
    case 'invoice_sent':
      return 'warning'
    case 'payment_confirmed':
      return 'info'
    case 'activated':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'neutral'
  }
}

function resolveInvoiceAmount(amount: string, estimatedTotal: string | null) {
  const parsed = Number(amount)
  if (!amount || parsed <= 0) {
    return Number(estimatedTotal) || 0
  }
  return Math.max(parsed || 0, 0)
}

export function AddOnRequestDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [amountOverride, setAmountOverride] = useState<string | null>(null)
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null)
  const [notes, setNotes] = useState(
    'Please complete payment using the agreed Cyber-Zeb payment channel.',
  )
  const [actionError, setActionError] = useState('')

  const queryKey = ['super-admin', 'addon-request', id] as const

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getAddOnRequest(id),
    enabled: Boolean(id),
  })

  const amount =
    amountOverride ?? (data?.estimated_total != null ? String(data.estimated_total) : '')
  const currency = currencyOverride ?? data?.estimated_currency ?? 'USD'

  function setQueryDataFrom(response: typeof data) {
    if (response) queryClient.setQueryData(queryKey, response)
    queryClient.invalidateQueries({ queryKey: ['super-admin', 'addon-requests'] })
  }

  async function recoverAfterNetworkGlitch(previousStatus: ServiceRequestStatus | undefined) {
    try {
      const fresh = await getAddOnRequest(id)
      setQueryDataFrom(fresh)
      // Server may have committed even if the HTTP client saw a transport error.
      if (previousStatus && fresh.status !== previousStatus) {
        setActionError('')
        return true
      }
    } catch {
      /* keep original error */
    }
    return false
  }

  const invoiceMutation = useMutation({
    mutationFn: () =>
      sendAddOnInvoice(id, {
        invoice_amount: resolveInvoiceAmount(amount, data?.estimated_total ?? null),
        invoice_currency: currency,
        invoice_notes: notes,
      }),
    onSuccess: (res) => {
      setActionError('')
      setQueryDataFrom(res)
    },
    onError: async (err: Error) => {
      const recovered = await recoverAfterNetworkGlitch(data?.status)
      if (!recovered) setActionError(err.message)
    },
  })

  const payMutation = useMutation({
    mutationFn: () => confirmAddOnPayment(id),
    onSuccess: (res) => {
      setActionError('')
      setQueryDataFrom(res)
    },
    onError: async (err: Error) => {
      const recovered = await recoverAfterNetworkGlitch(data?.status)
      if (!recovered) setActionError(err.message)
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => activateAddOnRequest(id),
    onSuccess: (res) => {
      setActionError('')
      setQueryDataFrom(res)
    },
    onError: async (err: Error) => {
      const recovered = await recoverAfterNetworkGlitch(data?.status)
      if (!recovered) setActionError(err.message)
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendAddOnRequestEmail(id),
    onSuccess: (res) => {
      setActionError('')
      setQueryDataFrom(res)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  if (isLoading && !data) {
    return <p className="text-[13px] text-secondary-text">Loading…</p>
  }
  // Only treat as a load failure when we have nothing to show. A background
  // refetch error must not replace a successfully loaded request with "Network Error".
  if (!data) {
    return (
      <p className="text-[13px] font-semibold text-danger">
        {error instanceof Error ? error.message : 'Add-on request not found'}
      </p>
    )
  }

  const status = data.status
  const emailLogs = data.email_logs ?? []
  const estimateLabel =
    data.estimated_total != null
      ? `${data.estimated_total} ${data.estimated_currency || ''}`.trim()
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900">{data.tenant_name}</h1>
          <p className="text-[13px] text-secondary-text mt-1">
            {data.contact_name} · {data.email}
            {data.phone ? ` · ${data.phone}` : ''}
          </p>
        </div>
        <StatusPill label={`Add Modules · ${STATUS_LABELS[status]}`} tone={statusTone(status)} />
      </div>

      {data.last_email_error && (
        <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-[13px] text-danger font-semibold flex flex-wrap items-center justify-between gap-3">
          <span>
            Email failed to send: {data.last_email_error}. DB state was still updated.
          </span>
          <Button
            type="button"
            variant="danger"
            disabled={resendMutation.isPending}
            onClick={() => {
              setActionError('')
              resendMutation.mutate()
            }}
          >
            {resendMutation.isPending ? 'Resending…' : 'Resend'}
          </Button>
        </div>
      )}

      {actionError && (
        <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2 p-5 space-y-4">
          <h2 className="text-[14px] font-extrabold text-navy-900">Request details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <Item label="Tenant slug" value={data.tenant_slug} />
            <Item label="Submitted" value={new Date(data.created_at).toLocaleString()} />
            {estimateLabel && <Item label="Estimated total" value={estimateLabel} />}
          </dl>
          {data.message && (
            <p className="text-[13px] text-secondary-text bg-canvas rounded-xl p-3">{data.message}</p>
          )}
          <div>
            <p className="text-[12px] font-bold text-navy-900 mb-2">Requested modules</p>
            <ul className="flex flex-wrap gap-2">
              {data.requested_modules.map((m) => (
                <li
                  key={m}
                  className="text-[11.5px] font-semibold bg-lemon-50 text-navy-900 px-2.5 py-1 rounded-lg border border-lemon-500/30"
                >
                  {MODULE_LABELS[m as ModuleKey] ?? m}
                </li>
              ))}
            </ul>
            {estimateLabel && (
              <p className="mt-3 text-[13px] font-bold text-navy-900">
                Estimated total: {estimateLabel}
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-4">
          <h2 className="text-[14px] font-extrabold text-navy-900">Actions</h2>
          <p className="text-[12px] text-secondary-text leading-relaxed">
            New → Send Invoice → Confirm Payment → Activate &amp; Send Link
          </p>

          {status === 'new' && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11.5px] font-bold">Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmountOverride(e.target.value)}
                  className="mt-1 w-full border border-divider rounded-lg px-3 py-2 text-[13px]"
                />
              </label>
              <label className="block">
                <span className="text-[11.5px] font-bold">Currency</span>
                <input
                  value={currency}
                  onChange={(e) => setCurrencyOverride(e.target.value)}
                  className="mt-1 w-full border border-divider rounded-lg px-3 py-2 text-[13px]"
                />
              </label>
              <label className="block">
                <span className="text-[11.5px] font-bold">Payment instructions</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-1 w-full border border-divider rounded-lg px-3 py-2 text-[13px]"
                />
              </label>
              <Button
                type="button"
                disabled={invoiceMutation.isPending}
                onClick={() => {
                  setActionError('')
                  invoiceMutation.mutate()
                }}
                className="w-full justify-center"
              >
                {invoiceMutation.isPending ? 'Sending…' : 'Send Invoice'}
              </Button>
            </div>
          )}

          {status === 'invoice_sent' && (
            <Button
              type="button"
              disabled={payMutation.isPending}
              onClick={() => {
                setActionError('')
                payMutation.mutate()
              }}
              className="w-full justify-center"
            >
              {payMutation.isPending ? 'Confirming…' : 'Confirm Payment'}
            </Button>
          )}

          {status === 'payment_confirmed' && (
            <Button
              type="button"
              disabled={activateMutation.isPending}
              onClick={() => {
                setActionError('')
                activateMutation.mutate()
              }}
              className="w-full justify-center"
            >
              {activateMutation.isPending ? 'Activating…' : 'Activate & Send Link'}
            </Button>
          )}

          {status === 'activated' && (
            <p className="text-[12.5px] font-semibold text-leaf-700">
              Add-on modules activated for this tenant.
            </p>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-[14px] font-extrabold text-navy-900 mb-3">Email log</h2>
        {emailLogs.length === 0 ? (
          <p className="text-[12.5px] text-secondary-text">No emails recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {emailLogs.map((log) => (
              <li key={log.id} className="rounded-xl border border-divider p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-navy-900">{log.subject}</p>
                  <StatusPill
                    label={log.status}
                    tone={log.status === 'sent' ? 'success' : 'danger'}
                  />
                </div>
                <p className="text-[12px] text-secondary-text mt-1">
                  {log.email_type} → {log.to_email} · {new Date(log.sent_at).toLocaleString()}
                </p>
                <pre className="mt-2 text-[11.5px] whitespace-pre-wrap text-navy-700 bg-canvas rounded-lg p-2 max-h-40 overflow-auto">
                  {log.body_preview}
                </pre>
                {log.error_message && (
                  <p className="mt-1 text-[12px] text-danger font-semibold">{log.error_message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">{label}</dt>
      <dd className="text-navy-900 font-semibold mt-0.5">{value}</dd>
    </div>
  )
}
