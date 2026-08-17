import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { StatusPill, type StatusTone } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { listServiceRequests } from '../api/serviceRequestApi'
import { STATUS_LABELS, type ServiceRequestStatus } from '../types'

const FILTERS: { id: ServiceRequestStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'invoice_sent', label: 'Invoice Sent' },
  { id: 'payment_confirmed', label: 'Payment Confirmed' },
  { id: 'activated', label: 'Activated' },
  { id: 'rejected', label: 'Rejected' },
]

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

export function ServiceRequestsListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ServiceRequestStatus | 'all'>('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'service-requests', filter],
    queryFn: () => listServiceRequests(filter),
  })

  const tabLabels = FILTERS.map((f) => f.label)
  const activeLabel = FILTERS.find((f) => f.id === filter)?.label ?? 'All'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Service requests</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Review landing-page requests, send invoices, confirm payment, and activate tenants.
        </p>
      </div>

      <FilterTabs
        tabs={tabLabels}
        active={activeLabel}
        onChange={(label) => {
          const match = FILTERS.find((f) => f.label === label)
          if (match) setFilter(match.id)
        }}
      />

      <GlassCard className="overflow-hidden">
        {isLoading && (
          <p className="p-6 text-[13px] text-secondary-text">Loading requests…</p>
        )}
        {error && (
          <p className="p-6 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {data && data.items.length === 0 && (
          <p className="p-6 text-[13px] text-secondary-text">No requests in this filter.</p>
        )}
        {data && data.items.length > 0 && (
          <ul className="divide-y divide-divider">
            {data.items.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/super-admin/requests/${row.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-canvas/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14.5px] font-extrabold text-navy-900">
                        {row.institution_name}
                      </p>
                      <p className="text-[12.5px] text-secondary-text mt-0.5">
                        {row.contact_name} · {row.email} · {row.phone}
                      </p>
                    </div>
                    <StatusPill label={STATUS_LABELS[row.status]} tone={statusTone(row.status)} />
                  </div>
                  <p className="text-[11.5px] text-secondary-text mt-2">
                    {new Date(row.created_at).toLocaleString()} ·{' '}
                    {row.requested_modules.length} modules
                    {row.last_email_error ? ' · email delivery issue' : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}
