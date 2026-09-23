import { useMemo, useState } from 'react'
import { AlarmClock, CalendarClock, Loader2, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useRequiredTraining } from '../hooks/useRequiredTraining'
import { computeOrganizationComplianceRate } from '../utils/complianceUtils'
import type { ComplianceAlert, ComplianceStatus } from '../types'

const STAT = 17

const statusTone: Record<ComplianceStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  compliant: 'success',
  'at-risk': 'warning',
  overdue: 'danger',
  expiring: 'warning',
  'not-assigned': 'neutral',
}

const statusLabel: Record<ComplianceStatus, string> = {
  compliant: 'compliant',
  'at-risk': 'at risk',
  overdue: 'overdue',
  expiring: 'recertification due',
  'not-assigned': 'not assigned',
}

const ALERT_META: Record<
  ComplianceAlert['kind'],
  { label: string; tone: 'danger' | 'warning' | 'neutral'; icon: typeof AlarmClock }
> = {
  overdue: { label: 'Overdue', tone: 'danger', icon: TriangleAlert },
  unassigned: { label: 'Not assigned', tone: 'warning', icon: AlarmClock },
  'due-soon': { label: 'Due soon', tone: 'warning', icon: CalendarClock },
  recertification: { label: 'Recertification', tone: 'neutral', icon: RefreshCw },
}

function alertDetail(alert: ComplianceAlert): string {
  if (alert.kind === 'unassigned') return 'Required by job role — never assigned'
  if (alert.daysFromNow === undefined) return alert.date ?? ''
  if (alert.daysFromNow < 0) return `${Math.abs(alert.daysFromNow)} days late`
  if (alert.daysFromNow === 0) return 'Due today'
  return `in ${alert.daysFromNow} days`
}

export function CorporateCompliancePage() {
  const { complianceRows: rows, alerts, pendingCount, assignAll } = useRequiredTraining()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigning, setAssigning] = useState(false)
  const [assignMessage, setAssignMessage] = useState<string | null>(null)

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
  const expiringCount = rows.reduce((sum, r) => sum + r.expiringTraining, 0)

  function handleAssignAll() {
    setAssigning(true)
    setAssignMessage(null)
    try {
      const result = assignAll()
      setAssignMessage(
        result.created === 0
          ? 'Everyone already has the training their job role requires.'
          : `Assigned ${result.created} course${result.created === 1 ? '' : 's'} to ${result.employees} employee${result.employees === 1 ? '' : 's'}.`,
      )
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        subtitle="Mandatory training from job roles: what is assigned, what is late, and what needs taking again."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatBlock icon={<ShieldCheck size={STAT} />} label="Organization compliance" value={`${orgRate}%`} />
        <StatBlock
          icon={<ShieldCheck size={STAT} />}
          label="Employees tracked"
          value={rows.filter((r) => r.status !== 'not-assigned').length}
        />
        <StatBlock icon={<TriangleAlert size={STAT} />} label="Overdue employees" value={overdueCount} />
        <StatBlock icon={<RefreshCw size={STAT} />} label="Recertifications due" value={expiringCount} />
      </div>

      <GlassCard className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="text-[13px] font-semibold text-navy-900">
            {pendingCount > 0
              ? `${pendingCount} required course${pendingCount === 1 ? '' : 's'} not yet assigned`
              : 'All required training is assigned'}
          </p>
          <p className="text-[12px] text-secondary-text">
            Assignment comes from each employee&rsquo;s job role, with a due date and automatic
            recertification.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAssignAll}
          disabled={assigning || pendingCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-5 py-2.5 text-[13px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {assigning ? <Loader2 size={14} className="animate-spin" /> : null}
          Assign required training
        </button>
      </GlassCard>

      {assignMessage ? (
        <p className="rounded-lg bg-info-bg px-3.5 py-2.5 text-[13px] font-semibold text-info">
          {assignMessage}
        </p>
      ) : null}

      {alerts.length > 0 ? (
        <GlassCard className="p-0 overflow-hidden">
          <div className="border-b border-divider px-4 py-3">
            <h2 className="text-[13px] font-bold text-navy-900">Needs attention</h2>
            <p className="text-[12px] text-secondary-text">
              Late training first, then anything due or expiring shortly.
            </p>
          </div>
          <ul className="divide-y divide-divider/60 max-h-80 overflow-y-auto app-scroll">
            {alerts.slice(0, 50).map((alert) => {
              const meta = ALERT_META[alert.kind]
              const Icon = meta.icon
              return (
                <li
                  key={`${alert.employeeId}-${alert.courseId}-${alert.kind}`}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <Icon size={15} className="shrink-0 text-secondary-text" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-navy-900">
                      {alert.employeeName}
                    </p>
                    <p className="truncate text-[12px] text-secondary-text">{alert.courseTitle}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-secondary-text">
                    {alertDetail(alert)}
                  </span>
                  <StatusPill label={meta.label} tone={meta.tone} />
                </li>
              )
            })}
          </ul>
        </GlassCard>
      ) : null}

      <GlassCard className="p-4 flex flex-wrap gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search employees…"
          className="flex-1 min-w-[200px]"
        />
        <SelectMenu
          value={statusFilter}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'compliant', label: 'Compliant' },
            { value: 'at-risk', label: 'At risk' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'expiring', label: 'Recertification due' },
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
              <th className="px-4 py-3">Due soon</th>
              <th className="px-4 py-3">Recert.</th>
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
                <td className="px-4 py-3 text-[13px]">
                  {row.requiredTraining}
                  {row.missingAssignments > 0 ? (
                    <span className="ms-1.5 text-[11.5px] font-semibold text-warning">
                      ({row.missingAssignments} unassigned)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[13px]">{row.completedTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.overdueTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.dueSoonTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.expiringTraining}</td>
                <td className="px-4 py-3 text-[13px]">{row.compliancePercent}%</td>
                <td className="px-4 py-3">
                  <StatusPill label={statusLabel[row.status]} tone={statusTone[row.status]} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[13px] text-secondary-text">
                  No employees match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
