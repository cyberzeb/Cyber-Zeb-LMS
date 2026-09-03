import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useJobRoles } from '../hooks/useJobRoles'
import { buildEmployeeComplianceRows, computeOrganizationComplianceRate } from '../utils/complianceUtils'
import type { ComplianceStatus } from '../types'

const STAT = 17

const statusTone: Record<ComplianceStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  compliant: 'success',
  'at-risk': 'warning',
  overdue: 'danger',
  'not-assigned': 'neutral',
}

export function CorporateCompliancePage() {
  const { jobRoles } = useJobRoles()
  const rows = useMemo(() => buildEmployeeComplianceRows(undefined, undefined, jobRoles), [jobRoles])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesQuery =
        q === '' ||
        row.employeeName.toLowerCase().includes(q) ||
        row.jobRoleTitle.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [rows, query, statusFilter])

  const orgRate = computeOrganizationComplianceRate(rows)
  const overdueCount = rows.filter((r) => r.status === 'overdue').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        subtitle="Monitor mandatory training completion, overdue assignments, and workforce compliance status."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock icon={<ShieldCheck size={STAT} />} label="Organization compliance" value={`${orgRate}%`} />
        <StatBlock icon={<ShieldCheck size={STAT} />} label="Employees tracked" value={rows.filter((r) => r.status !== 'not-assigned').length} />
        <StatBlock icon={<ShieldCheck size={STAT} />} label="Overdue employees" value={overdueCount} />
      </div>

      <GlassCard className="p-4 flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search employees…" className="flex-1 min-w-[200px]" />
        <SelectMenu
          value={statusFilter}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'compliant', label: 'Compliant' },
            { value: 'at-risk', label: 'At risk' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'not-assigned', label: 'Not assigned' },
          ]}
          onChange={setStatusFilter}
        />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-divider bg-navy-50/40 text-[11px] uppercase tracking-wide text-secondary-text">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Job role</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.employeeId} className="border-b border-divider/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-[13px] font-semibold text-navy-900">{row.employeeName}</div>
                  <div className="text-[12px] text-secondary-text">{row.department}</div>
                </td>
                <td className="px-4 py-3 text-[13px]">{row.jobRoleTitle}</td>
                <td className="px-4 py-3 text-[13px]">{row.requiredTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.completedTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.overdueTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.compliancePercent}%</td>
                <td className="px-4 py-3">
                  <StatusPill label={row.status} tone={statusTone[row.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
