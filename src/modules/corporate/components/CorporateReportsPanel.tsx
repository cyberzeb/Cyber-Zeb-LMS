/**
 * Corporate reporting.
 *
 * A company does not care about GPA distribution or tuition revenue; it cares
 * whether its workforce is compliant. These are the numbers a learning admin is
 * actually asked for: compliance rate, who is late, what expires soon, and how
 * each department and job role is doing — all exportable as CSV.
 */
import { useMemo } from 'react'
import { Download, RefreshCw, ShieldCheck, TriangleAlert, Users } from 'lucide-react'

import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { MiniBarChart } from '../../institution/components/MiniBarChart'
import { useRequiredTraining } from '../hooks/useRequiredTraining'
import { computeOrganizationComplianceRate } from '../utils/complianceUtils'

const STAT = 17

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function CorporateReportsPanel() {
  const { complianceRows, alerts, jobRoles, activeEmployees } = useRequiredTraining()

  const complianceRate = computeOrganizationComplianceRate(complianceRows)
  const overdueEmployees = complianceRows.filter((r) => r.status === 'overdue').length
  const recertDue = complianceRows.reduce((sum, r) => sum + r.expiringTraining, 0)
  const unassigned = complianceRows.reduce((sum, r) => sum + r.missingAssignments, 0)

  /** Average compliance per department, so gaps are visible by area. */
  const byDepartment = useMemo(() => {
    const buckets = new Map<string, { total: number; count: number }>()
    for (const row of complianceRows) {
      if (row.status === 'not-assigned') continue
      const key = row.department || 'Unassigned'
      const bucket = buckets.get(key) ?? { total: 0, count: 0 }
      bucket.total += row.compliancePercent
      bucket.count += 1
      buckets.set(key, bucket)
    }
    return [...buckets.entries()]
      .map(([label, { total, count }]) => ({ label, value: Math.round(total / count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [complianceRows])

  const byJobRole = useMemo(() => {
    const buckets = new Map<string, { total: number; count: number }>()
    for (const row of complianceRows) {
      if (row.status === 'not-assigned' || !row.jobRoleId) continue
      const bucket = buckets.get(row.jobRoleTitle) ?? { total: 0, count: 0 }
      bucket.total += row.compliancePercent
      bucket.count += 1
      buckets.set(row.jobRoleTitle, bucket)
    }
    return [...buckets.entries()]
      .map(([label, { total, count }]) => ({ label, value: Math.round(total / count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [complianceRows])

  function exportCompliance() {
    downloadCsv('workforce-compliance.csv', [
      [
        'Employee',
        'Department',
        'Job role',
        'Required',
        'Completed',
        'Overdue',
        'Due soon',
        'Recertification due',
        'Unassigned',
        'Compliance %',
        'Status',
      ],
      ...complianceRows.map((r) => [
        r.employeeName,
        r.department,
        r.jobRoleTitle,
        r.requiredTraining,
        r.completedTraining,
        r.overdueTraining,
        r.dueSoonTraining,
        r.expiringTraining,
        r.missingAssignments,
        r.compliancePercent,
        r.status,
      ]),
    ])
  }

  function exportAlerts() {
    downloadCsv('compliance-alerts.csv', [
      ['Employee', 'Training', 'Issue', 'Date', 'Days from now'],
      ...alerts.map((a) => [
        a.employeeName,
        a.courseTitle,
        a.kind,
        a.date ?? '',
        a.daysFromNow ?? '',
      ]),
    ])
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatBlock
          label="Workforce compliance"
          value={`${complianceRate}%`}
          sub="Fully compliant staff"
          icon={<ShieldCheck size={STAT} />}
        />
        <StatBlock
          label="Employees tracked"
          value={complianceRows.filter((r) => r.status !== 'not-assigned').length}
          sub={`${activeEmployees.length} total`}
          icon={<Users size={STAT} />}
        />
        <StatBlock
          label="Overdue employees"
          value={overdueEmployees}
          sub="Past a due date"
          icon={<TriangleAlert size={STAT} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Recertifications due"
          value={recertDue}
          sub="Expiring or expired"
          icon={<RefreshCw size={STAT} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Unassigned training"
          value={unassigned}
          sub="Required, not yet given"
          icon={<TriangleAlert size={STAT} />}
          iconBg="bg-warning-bg text-warning"
        />
        <StatBlock
          label="Job roles"
          value={jobRoles.filter((r) => r.status === 'active').length}
          sub="Driving requirements"
          icon={<ShieldCheck size={STAT} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniBarChart
          title="Compliance by department"
          subtitle="Average completion of required training"
          data={byDepartment}
          unit="%"
        />
        <MiniBarChart
          title="Compliance by job role"
          subtitle="Average completion of required training"
          data={byJobRole}
          unit="%"
        />
      </div>

      <GlassCard className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="text-[13px] font-semibold text-navy-900">Export for audit</p>
          <p className="text-[12px] text-secondary-text">
            Full workforce compliance, or just the items that need action.
          </p>
        </div>
        <Button variant="secondary" onClick={exportCompliance}>
          <Download size={15} />
          Compliance CSV
        </Button>
        <Button variant="secondary" onClick={exportAlerts} disabled={alerts.length === 0}>
          <Download size={15} />
          Alerts CSV
        </Button>
      </GlassCard>
    </>
  )
}
