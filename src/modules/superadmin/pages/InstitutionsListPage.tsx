import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { institutionTypeLabel } from '../../../shared/constants/institutionTypes'
import { setActiveTenant } from '../../../shared/config/tenant'
import { listInstitutions } from '../api/serviceRequestApi'

export function InstitutionsListPage() {
  const navigate = useNavigate()

  const openInstitutionPortal = (row: {
    name: string
    slug: string | null
    institution_type: 'college_university' | 'training' | 'corporate'
  }) => {
    setActiveTenant({
      slug: row.slug ?? row.name.toLowerCase().replace(/\s+/g, '-'),
      name: row.name,
      institutionType: row.institution_type,
    })
    navigate('/admin')
  }
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['super-admin', 'institutions'],
    queryFn: listInstitutions,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Institutions</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          All tenants on the platform.
        </p>
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-secondary-text">Loading institutions…</p>}
        {error && (
          <p className="p-5 text-[13px] font-semibold text-danger">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        )}
        {!isLoading && !error && data.length === 0 && (
          <p className="p-5 text-[13px] text-secondary-text">No institutions yet.</p>
        )}
        <ul className="divide-y divide-divider">
          {data.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => navigate(`/super-admin/institutions/${row.id}`)}
                className="w-full text-left px-5 py-4 hover:bg-canvas/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14.5px] font-extrabold text-navy-900">{row.name}</p>
                    <p className="text-[12.5px] text-secondary-text mt-0.5">
                      {institutionTypeLabel(row.institution_type)} · {row.slug || '—'} ·{' '}
                      {row.enabled_modules.length} modules
                      {row.renewal_date
                        ? ` · renews ${new Date(row.renewal_date).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        openInstitutionPortal(row)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          openInstitutionPortal(row)
                        }
                      }}
                      className="rounded-lg border border-divider px-3 py-1.5 text-[12px] font-bold text-navy-900 hover:bg-lemon-500/15 hover:border-lemon-500 transition-colors cursor-pointer"
                    >
                      Open portal
                    </span>
                    <StatusPill
                      label={row.status}
                      tone={row.status === 'active' ? 'success' : 'neutral'}
                    />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
