import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { institutionTypeLabel } from '../../../shared/constants/institutionTypes'
import { getInstitution } from '../api/serviceRequestApi'
import { MODULE_LABELS, type ModuleKey } from '../types'

export function InstitutionDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'institution', id],
    queryFn: () => getInstitution(id),
    enabled: Boolean(id),
  })

  if (isLoading) return <p className="text-[13px] text-secondary-text">Loading…</p>
  if (error || !data) {
    return (
      <p className="text-[13px] font-semibold text-danger">
        {error instanceof Error ? error.message : 'Institution not found'}
      </p>
    )
  }

  const estimateLabel =
    data.estimated_total != null
      ? `${data.estimated_total} ${data.estimated_currency || ''}`.trim()
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy-900">{data.name}</h1>
          <p className="text-[13px] text-secondary-text mt-1">
            {data.slug || 'No slug'} · {institutionTypeLabel(data.institution_type)} · Admin:{' '}
            {data.admin_email || '—'}
          </p>
        </div>
        <StatusPill label={data.status} tone={data.status === 'active' ? 'success' : 'neutral'} />
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-[14px] font-extrabold text-navy-900">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <Item label="Institution type" value={institutionTypeLabel(data.institution_type)} />
          <Item
            label="Institution link"
            value={
              <a className="text-info font-semibold underline" href={data.institution_link}>
                {data.institution_link}
              </a>
            }
          />
          <Item
            label="Subscription start"
            value={
              data.subscription_start_date
                ? new Date(data.subscription_start_date).toLocaleDateString()
                : '—'
            }
          />
          <Item
            label="Renewal date"
            value={
              data.renewal_date ? new Date(data.renewal_date).toLocaleDateString() : '—'
            }
          />
          {estimateLabel && <Item label="Estimated annual" value={estimateLabel} />}
        </dl>

        <div>
          <p className="text-[12px] font-bold text-navy-900 mb-2">Enabled modules</p>
          <ul className="flex flex-wrap gap-2">
            {data.enabled_modules.map((m) => (
              <li
                key={m}
                className="text-[11.5px] font-semibold bg-lemon-50 text-navy-900 px-2.5 py-1 rounded-lg border border-lemon-500/30"
              >
                {MODULE_LABELS[m as ModuleKey] ?? m}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    </div>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-secondary-text uppercase tracking-wide">{label}</dt>
      <dd className="text-navy-900 font-semibold mt-0.5">{value}</dd>
    </div>
  )
}
