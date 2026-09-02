import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { listEmailLogs } from '../api/serviceRequestApi'

const PAGE_SIZE = 50

export function NotificationsPage() {
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState<'all' | 'sent' | 'failed'>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'email-logs', status, offset],
    queryFn: () =>
      listEmailLogs({
        status: status === 'all' ? undefined : status,
        offset,
        limit: PAGE_SIZE,
      }),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Notifications</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Platform email delivery log.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'sent', 'failed'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s)
              setOffset(0)
            }}
            className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
              status === s
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-divider text-navy-900'
            }`}
          >
            {s === 'all' ? 'All' : s === 'sent' ? 'Sent' : 'Failed'}
          </button>
        ))}
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading email logs…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No emails recorded.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas text-[11px] uppercase tracking-wide text-secondary-text">
              <tr>
                <th className="px-4 py-3 font-bold">Subject</th>
                <th className="px-4 py-3 font-bold">To</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {items.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-semibold text-navy-900">{log.subject}</td>
                  <td className="px-4 py-3 text-secondary-text">{log.to_email}</td>
                  <td className="px-4 py-3 text-secondary-text">{log.email_type}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={log.status}
                      tone={log.status === 'sent' ? 'success' : 'danger'}
                    />
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {new Date(log.sent_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-divider px-5 py-3">
            <p className="text-[12px] text-secondary-text">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="rounded-lg border border-divider px-3 py-2 text-[12px] font-bold text-navy-900 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="rounded-lg border border-divider px-3 py-2 text-[12px] font-bold text-navy-900 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
