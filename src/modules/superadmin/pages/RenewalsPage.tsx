import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { listRenewals, markTenantRenewed, sendRenewalReminder } from '../api/serviceRequestApi'
import type { RenewalTenant } from '../types'

export function RenewalsPage() {
  const queryClient = useQueryClient()
  const [reminderErrors, setReminderErrors] = useState<Record<string, string>>({})
  const [reminderSent, setReminderSent] = useState<Record<string, string>>({})

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'renewals'],
    queryFn: () => listRenewals(30),
  })

  const renew = useMutation({
    mutationFn: markTenantRenewed,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'renewals'] }),
  })

  const sendReminder = useMutation({
    mutationFn: (tenantId: string) => sendRenewalReminder(tenantId),
    onSuccess: (result, tenantId) => {
      if (result.email_ok) {
        setReminderSent((prev) => ({
          ...prev,
          [tenantId]: result.reminder_sent_at,
        }))
        setReminderErrors((prev) => {
          const next = { ...prev }
          delete next[tenantId]
          return next
        })
      } else {
        setReminderErrors((prev) => ({
          ...prev,
          [tenantId]: result.error_message ?? 'Email send failed',
        }))
      }
    },
    onError: (err: Error, tenantId) => {
      setReminderErrors((prev) => ({ ...prev, [tenantId]: err.message }))
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Renewals</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Institutions due for renewal in the next 30 days.
        </p>
      </div>
      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading renewals...</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && data.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No upcoming renewals.</p>
        )}
        <div className="divide-y divide-divider">
          {data.map((tenant: RenewalTenant) => {
            const renewalDate = tenant.renewal_date ? new Date(tenant.renewal_date) : null
            const overdue = renewalDate ? renewalDate < new Date() : false
            const sentAt = reminderSent[tenant.id]
            const reminderErr = reminderErrors[tenant.id]
            const isReminderPending =
              sendReminder.isPending && sendReminder.variables === tenant.id

            return (
              <div key={tenant.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-extrabold text-navy-900">{tenant.name}</p>
                    <p className="text-[12.5px] text-secondary-text">{tenant.institution_link}</p>
                    <p className="mt-1 text-[12px] text-secondary-text">
                      Renewal:{' '}
                      {renewalDate ? renewalDate.toLocaleDateString() : 'Not set'} ·{' '}
                      {tenant.enabled_modules.length} modules
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill
                      label={overdue ? 'Overdue' : tenant.status}
                      tone={overdue ? 'danger' : 'warning'}
                    />
                    <button
                      type="button"
                      disabled={isReminderPending || sendReminder.isPending}
                      onClick={() => {
                        setReminderErrors((prev) => {
                          const next = { ...prev }
                          delete next[tenant.id]
                          return next
                        })
                        sendReminder.mutate(tenant.id)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-divider px-3 py-2 text-[12px] font-bold text-navy-900 hover:bg-canvas disabled:opacity-50"
                    >
                      <Mail size={13} />
                      {isReminderPending ? 'Sending…' : 'Send Reminder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => renew.mutate(tenant.id)}
                      disabled={renew.isPending}
                      className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
                    >
                      Mark renewed
                    </button>
                  </div>
                </div>

                {/* Reminder feedback */}
                {sentAt && (
                  <div className="flex items-center gap-1.5 text-[12px] text-lemon-700 bg-lemon-50 px-3 py-2 rounded-lg border border-lemon-500/25">
                    <CheckCircle size={13} />
                    Reminder sent on {new Date(sentAt).toLocaleString()}
                  </div>
                )}
                {reminderErr && (
                  <p className="text-[12px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
                    Reminder failed: {reminderErr}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
