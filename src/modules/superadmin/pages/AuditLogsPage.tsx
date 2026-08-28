import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { listAuditLogs } from '../api/serviceRequestApi'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

const PAGE_SIZE = 25

export function AuditLogsPage() {
  const [action, setAction] = useState('')
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [offset, setOffset] = useState(0)
  const [applied, setApplied] = useState({ action: '', since: '', until: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'audit-logs', applied, offset],
    queryFn: () =>
      listAuditLogs({
        action: applied.action || undefined,
        since: applied.since || undefined,
        until: applied.until || undefined,
        offset,
        limit: PAGE_SIZE,
      }),
  })

  const total = data?.total ?? 0
  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Audit logs</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Platform actions recorded for super-admin operations.
        </p>
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
          <input
            className={inputClass}
            placeholder="Filter by action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <input
            className={inputClass}
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
          />
          <input
            className={inputClass}
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              setOffset(0)
              setApplied({
                action: action.trim(),
                since: since ? new Date(since).toISOString() : '',
                until: until ? new Date(`${until}T23:59:59`).toISOString() : '',
              })
            }}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
          >
            Apply
          </button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading audit logs…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No audit logs match these filters.</p>
        )}
        <div className="divide-y divide-divider">
          {items.map((log) => (
            <div key={log.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-extrabold text-navy-900">{log.summary}</p>
                  <p className="text-[12px] text-secondary-text mt-0.5">
                    {log.actor_email || 'Unknown actor'} · {log.action} · {log.entity_type}{' '}
                    {log.entity_id}
                  </p>
                </div>
                <p className="text-[11.5px] text-secondary-text">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
              <details className="text-[12px]">
                <summary className="cursor-pointer font-semibold text-navy-900">
                  Before / after
                </summary>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <pre className="bg-canvas rounded-lg p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(log.before, null, 2)}
                  </pre>
                  <pre className="bg-canvas rounded-lg p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(log.after, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ))}
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
