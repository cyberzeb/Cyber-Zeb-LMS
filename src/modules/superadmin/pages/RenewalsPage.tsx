import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { listRenewals, markTenantRenewed } from '../api/serviceRequestApi'

export function RenewalsPage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'renewals'],
    queryFn: () => listRenewals(30),
  })
  const renew = useMutation({
    mutationFn: markTenantRenewed,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'renewals'] }),
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
        {error && <p className="p-5 text-[13px] font-semibold text-danger">{error instanceof Error ? error.message : 'Failed to load'}</p>}
        {data.length === 0 && <p className="p-5 text-[13px] text-secondary-text">No upcoming renewals.</p>}
        <div className="divide-y divide-divider">
          {data.map((tenant) => {
            const renewalDate = tenant.renewal_date ? new Date(tenant.renewal_date) : null
            const overdue = renewalDate ? renewalDate < new Date() : false
            return (
              <div key={tenant.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-[14px] font-extrabold text-navy-900">{tenant.name}</p>
                  <p className="text-[12.5px] text-secondary-text">{tenant.institution_link}</p>
                  <p className="mt-1 text-[12px] text-secondary-text">
                    Renewal: {renewalDate ? renewalDate.toLocaleDateString() : 'Not set'} · {tenant.enabled_modules.length} modules
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill label={overdue ? 'Overdue' : tenant.status} tone={overdue ? 'danger' : 'warning'} />
                  <button
                    type="button"
                    onClick={() => renew.mutate(tenant.id)}
                    className="rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
                  >
                    Mark renewed
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
