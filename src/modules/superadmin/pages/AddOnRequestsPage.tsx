import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { listAddOnRequests } from '../api/serviceRequestApi'
import { MODULE_LABELS, STATUS_LABELS, type ServiceRequestStatus } from '../types'

export function AddOnRequestsPage() {
  const navigate = useNavigate()
  const [filter] = useState<ServiceRequestStatus | 'all'>('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'addon-requests', filter],
    queryFn: () => listAddOnRequests(filter),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Add-on requests</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Existing clients requesting additional modules. Open a request to invoice, confirm, or
          activate.
        </p>
      </div>
      <GlassCard className="overflow-hidden">
        {isLoading && (
          <p className="p-5 text-[13px] text-secondary-text">Loading add-on requests...</p>
        )}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {data?.items.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No add-on requests yet.</p>
        )}
        <ul className="divide-y divide-divider">
          {data?.items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => navigate(`/super-admin/addons/${row.id}`)}
                className="w-full text-left px-5 py-4 hover:bg-canvas/80 transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-extrabold text-navy-900">{row.tenant_name}</p>
                    <p className="text-[12.5px] text-secondary-text">
                      {row.contact_name} · {row.email}
                    </p>
                    <p className="mt-2 text-[12px] text-secondary-text">
                      {row.requested_modules.map((m) => MODULE_LABELS[m]).join(', ')}
                    </p>
                    {row.last_email_error && (
                      <p className="mt-2 text-[12px] font-semibold text-danger">
                        Email issue: {row.last_email_error}
                      </p>
                    )}
                  </div>
                  <StatusPill
                    label={`Add Modules · ${STATUS_LABELS[row.status]}`}
                    tone={row.status === 'activated' ? 'success' : 'info'}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
