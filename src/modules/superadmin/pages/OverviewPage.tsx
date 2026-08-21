import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { getOverview } from '../api/serviceRequestApi'
import { STATUS_LABELS, type ServiceRequestStatus } from '../types'

export function OverviewPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'overview'],
    queryFn: getOverview,
  })

  if (isLoading) return <p className="text-[13px] text-secondary-text">Loading overview…</p>
  if (error || !data) {
    return (
      <p className="text-[13px] font-semibold text-danger">
        {error instanceof Error ? error.message : 'Failed to load overview'}
      </p>
    )
  }

  const stats = [
    { label: 'Total institutions', value: data.total_institutions },
    { label: 'Active institutions', value: data.active_institutions },
    { label: 'Pending service requests', value: data.pending_service_requests },
    { label: 'Pending add-on requests', value: data.pending_addon_requests },
    {
      label: 'Estimated annual revenue',
      value: `${data.estimated_annual_revenue} ${data.revenue_currency}`,
    },
    { label: 'Renewing within 30 days', value: data.renewing_within_30_days },
  ]

  const quickActions = [
    { label: 'Service requests', to: '/super-admin/requests' },
    { label: 'Add-on requests', to: '/super-admin/addons' },
    { label: 'Modules & pricing', to: '/super-admin/modules' },
    { label: 'Renewals', to: '/super-admin/renewals' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Overview</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Platform snapshot from live tenant and request data.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <p className="text-[11px] font-medium text-secondary-text">{stat.label}</p>
            <p className="mt-1.5 text-[22px] font-bold text-navy-900 tracking-tight">{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-5">
        <h2 className="text-[14px] font-extrabold text-navy-900 mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard className="p-5 space-y-3">
          <h2 className="text-[14px] font-extrabold text-navy-900">Recent requests</h2>
          {data.recent_requests.length === 0 ? (
            <p className="text-[12.5px] text-secondary-text">No recent requests.</p>
          ) : (
            <ul className="divide-y divide-divider">
              {data.recent_requests.map((row) => {
                const to =
                  row.kind === 'addon_request'
                    ? `/super-admin/addons/${row.id}`
                    : `/super-admin/requests/${row.id}`
                return (
                  <li key={`${row.kind}-${row.id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(to)}
                      className="w-full text-left py-3 hover:bg-canvas/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-extrabold text-navy-900">{row.name}</p>
                          <p className="text-[11.5px] text-secondary-text mt-0.5">
                            {row.kind === 'addon_request' ? 'Add-on' : 'Service request'} ·{' '}
                            {new Date(row.created_at).toLocaleString()}
                          </p>
                        </div>
                        <StatusPill
                          label={STATUS_LABELS[row.status as ServiceRequestStatus] ?? row.status}
                          tone="info"
                        />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <h2 className="text-[14px] font-extrabold text-navy-900">Upcoming renewals</h2>
          {data.upcoming_renewals.length === 0 ? (
            <p className="text-[12.5px] text-secondary-text">No upcoming renewals.</p>
          ) : (
            <ul className="divide-y divide-divider">
              {data.upcoming_renewals.map((tenant) => (
                <li key={tenant.id} className="py-3">
                  <p className="text-[13px] font-extrabold text-navy-900">{tenant.name}</p>
                  <p className="text-[11.5px] text-secondary-text mt-0.5">
                    {tenant.renewal_date
                      ? new Date(tenant.renewal_date).toLocaleDateString()
                      : 'Date not set'}{' '}
                    · {tenant.enabled_modules.length} modules
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <h2 className="text-[14px] font-extrabold text-navy-900">Recent activity</h2>
          {data.recent_activity.length === 0 ? (
            <p className="text-[12.5px] text-secondary-text">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-divider">
              {data.recent_activity.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-[13px] font-semibold text-navy-900">{item.summary}</p>
                  <p className="text-[11.5px] text-secondary-text mt-0.5">
                    {item.action} · {new Date(item.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
