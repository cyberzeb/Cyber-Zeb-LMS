import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { listAuditLogsV2 } from '../api/serviceRequestApi'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

const PAGE_SIZE = 25

// Label → action code(s) mapping — the user picks a friendly label, never a raw string.
// Adding a new audit action: just add one entry here.
export const AUDIT_LABEL_MAP: { label: string; codes: string[] }[] = [
  { label: 'New service request', codes: ['service_request.created'] },
  { label: 'Invoice sent', codes: ['service_request.invoice_sent'] },
  { label: 'Payment confirmed', codes: ['service_request.payment_confirmed'] },
  { label: 'Service request rejected', codes: ['service_request.rejected'] },
  { label: 'Email resent', codes: ['service_request.email_resent', 'addon_request.email_resent'] },
  { label: 'Tenant activated', codes: ['tenant.activated'] },
  { label: 'Tenant renewed', codes: ['tenant.renewed'] },
  { label: 'Renewal reminder sent', codes: ['tenant.renewal_reminder_sent'] },
  { label: 'Add-on request created', codes: ['addon_request.created'] },
  { label: 'Add-on invoice sent', codes: ['addon_request.invoice_sent'] },
  { label: 'Add-on payment confirmed', codes: ['addon_request.payment_confirmed'] },
  { label: 'Add-on modules activated', codes: ['addon_request.activated'] },
  { label: 'Module catalog item created', codes: ['module_catalog.created'] },
  { label: 'Module catalog item updated', codes: ['module_catalog.updated'] },
  { label: 'Super admin signed in', codes: ['platform_admin.login'] },
  { label: 'Super admin invited', codes: ['platform_admin.invited'] },
  { label: 'Landing content created', codes: ['site_content.created'] },
  { label: 'Landing content updated', codes: ['site_content.updated'] },
  { label: 'Platform setting updated', codes: ['platform_setting.updated'] },
  { label: 'Branding updated', codes: ['branding.updated'] },
  { label: 'Integration connected', codes: ['integration.connected'] },
  { label: 'Integration disconnected', codes: ['integration.disconnected'] },
  { label: 'Super admin suspended', codes: ['security.admin_banned'] },
  { label: 'Super admin reinstated', codes: ['security.admin_unbanned'] },
  { label: 'User reported', codes: ['security.user_reported'] },
  { label: 'Report reviewed', codes: ['security.report_reviewed'] },
  { label: 'User banned', codes: ['security.user_banned'] },
  { label: 'User unbanned', codes: ['security.user_unbanned'] },
  { label: 'Backup created', codes: ['backup.created'] },
  { label: 'Database restore initiated', codes: ['backup.restore_initiated'] },
]

function ActionDropdown({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (labels: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggle = (label: string) => {
    if (selected.includes(label)) {
      onChange(selected.filter((l) => l !== label))
    } else {
      onChange([...selected, label])
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={selected.length === 0 ? 'text-secondary-text' : ''}>
          {selected.length === 0
            ? 'Filter by action…'
            : selected.length === 1
              ? selected[0]
              : `${selected.length} actions selected`}
        </span>
        <ChevronDown size={14} className="shrink-0 text-secondary-text" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-divider bg-white shadow-lg max-h-72 overflow-y-auto py-1">
          {AUDIT_LABEL_MAP.map(({ label }) => (
            <label
              key={label}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-canvas cursor-pointer text-[12.5px]"
            >
              <input
                type="checkbox"
                checked={selected.includes(label)}
                onChange={() => toggle(label)}
                className="accent-navy-900"
              />
              {label}
            </label>
          ))}
        </div>
      )}

      {/* Chips for selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-navy-50 text-navy-900 px-2 py-0.5 rounded-full border border-navy-900/10"
            >
              {label}
              <button type="button" onClick={() => toggle(label)} className="hover:text-danger">
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-secondary-text hover:text-danger"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function labelsToActionCodes(labels: string[]): string[] {
  if (labels.length === 0) return []
  return labels.flatMap(
    (label) => AUDIT_LABEL_MAP.find((m) => m.label === label)?.codes ?? [],
  )
}

export function AuditLogsPage() {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [offset, setOffset] = useState(0)
  const [applied, setApplied] = useState<{
    codes: string[]
    since: string
    until: string
  }>({ codes: [], since: '', until: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'audit-logs', applied, offset],
    queryFn: () =>
      listAuditLogsV2({
        actions: applied.codes.length ? applied.codes : undefined,
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
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <ActionDropdown selected={selectedLabels} onChange={setSelectedLabels} />
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
                codes: labelsToActionCodes(selectedLabels),
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
        {isLoading && (
          <p className="p-5 text-[13px] text-secondary-text">Loading audit logs…</p>
        )}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">
            No audit logs match these filters.
          </p>
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
