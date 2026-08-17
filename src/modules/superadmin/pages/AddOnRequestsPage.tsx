import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import {
  activateAddOnRequest,
  confirmAddOnPayment,
  listAddOnRequests,
  sendAddOnInvoice,
} from '../api/serviceRequestApi'
import { MODULE_LABELS, STATUS_LABELS, type ServiceRequestStatus } from '../types'

export function AddOnRequestsPage() {
  const queryClient = useQueryClient()
  const [filter] = useState<ServiceRequestStatus | 'all'>('all')
  const [invoice, setInvoice] = useState<Record<string, { amount: number; notes: string }>>({})
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'addon-requests', filter],
    queryFn: () => listAddOnRequests(filter),
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'addon-requests'] })
  const send = useMutation({
    mutationFn: (id: string) =>
      sendAddOnInvoice(id, {
        invoice_amount: invoice[id]?.amount || 0,
        invoice_currency: 'USD',
        invoice_notes: invoice[id]?.notes || 'Please complete payment using the agreed Cyber-Zeb payment channel.',
      }),
    onSuccess: invalidate,
  })
  const confirm = useMutation({ mutationFn: confirmAddOnPayment, onSuccess: invalidate })
  const activate = useMutation({ mutationFn: activateAddOnRequest, onSuccess: invalidate })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Add-on requests</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Existing clients requesting additional modules.
        </p>
      </div>
      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading add-on requests...</p>}
        {error && <p className="p-5 text-[13px] font-semibold text-danger">{error instanceof Error ? error.message : 'Failed to load'}</p>}
        {data?.items.length === 0 && <p className="p-5 text-[13px] text-secondary-text">No add-on requests yet.</p>}
        <div className="divide-y divide-divider">
          {data?.items.map((row) => (
            <div key={row.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-extrabold text-navy-900">{row.tenant_name}</p>
                  <p className="text-[12.5px] text-secondary-text">{row.contact_name} · {row.email}</p>
                  <p className="mt-2 text-[12px] text-secondary-text">
                    {row.requested_modules.map((m) => MODULE_LABELS[m]).join(', ')}
                  </p>
                </div>
                <StatusPill label={`Add Modules · ${STATUS_LABELS[row.status]}`} tone={row.status === 'activated' ? 'success' : 'info'} />
              </div>
              {row.status === 'new' && (
                <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_auto]">
                  <input className={inputClass} type="number" min={1} placeholder="Amount" value={invoice[row.id]?.amount ?? ''} onChange={(e) => setInvoice({ ...invoice, [row.id]: { amount: Number(e.target.value), notes: invoice[row.id]?.notes ?? '' } })} />
                  <input className={inputClass} placeholder="Payment instructions" value={invoice[row.id]?.notes ?? ''} onChange={(e) => setInvoice({ ...invoice, [row.id]: { amount: invoice[row.id]?.amount ?? 0, notes: e.target.value } })} />
                  <button className={buttonClass} type="button" onClick={() => send.mutate(row.id)}>Send invoice</button>
                </div>
              )}
              {row.status === 'invoice_sent' && <button className={`${buttonClass} mt-4`} type="button" onClick={() => confirm.mutate(row.id)}>Confirm payment</button>}
              {row.status === 'payment_confirmed' && <button className={`${buttonClass} mt-4 bg-leaf-700`} type="button" onClick={() => activate.mutate(row.id)}>Approve add-on</button>}
              {row.last_email_error && <p className="mt-3 text-[12px] font-semibold text-danger">Email issue: {row.last_email_error}</p>}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'
const buttonClass =
  'rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white'
