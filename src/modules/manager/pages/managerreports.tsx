import { useMemo } from 'react'
import { Download } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { COMPLIANCE_STATUS_LABEL, downloadCsv } from '../../corporate/utils/complianceLabels'
import { isEnrollmentComplete, isEnrollmentOverdue } from '../../corporate/utils/complianceUtils'
import { useManagedTeam } from '../hooks/useManagedTeam'

export function ManagerReportsPage() {
  const { rows, enrollments, teams } = useManagedTeam()

  // Completion per training module across the team.
  const byModule = useMemo(() => {
    const map = new Map<string, { title: string; assigned: number; complete: number; overdue: number }>()
    for (const e of enrollments) {
      if (e.status === 'withdrawn') continue
      const entry = map.get(e.courseId) ?? { title: `${e.courseCode} — ${e.courseTitle}`, assigned: 0, complete: 0, overdue: 0 }
      entry.assigned += 1
      if (isEnrollmentComplete(e)) entry.complete += 1
      else if (isEnrollmentOverdue(e)) entry.overdue += 1
      map.set(e.courseId, entry)
    }
    return [...map.values()].sort((a, b) => b.overdue - a.overdue || a.title.localeCompare(b.title))
  }, [enrollments])

  const teamName = teams.map((t) => t.name).join('-') || 'team'
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Reports" subtitle="Download your team's compliance and completion for sharing." />

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-navy-900">Team compliance</h2>
            <p className="text-[12.5px] text-secondary-text">One row per employee: required, completed, overdue and status.</p>
          </div>
          <Button
            variant="primary"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `${teamName}-compliance-${stamp}.csv`,
                rows.map((r) => ({
                  Employee: r.employeeName,
                  'Job role': r.jobRoleTitle,
                  Required: r.requiredTraining,
                  Completed: r.completedTraining,
                  Overdue: r.overdueTraining,
                  'Due soon': r.dueSoonTraining,
                  'Renewal due': r.expiringTraining,
                  'Compliance %': r.compliancePercent,
                  Status: COMPLIANCE_STATUS_LABEL[r.status],
                })),
              )
            }
          >
            <Download size={15} />
            Download CSV
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-navy-900">Completion by training module</h2>
            <p className="text-[12.5px] text-secondary-text">Worst first.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!byModule.length}
            onClick={() =>
              downloadCsv(
                `${teamName}-modules-${stamp}.csv`,
                byModule.map((m) => ({ Module: m.title, Assigned: m.assigned, Completed: m.complete, Overdue: m.overdue })),
              )
            }
          >
            <Download size={13} />
            CSV
          </Button>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-navy-50/60 text-left text-[11px] uppercase tracking-wide text-secondary-text dark:bg-white/5">
            <tr>
              <th className="px-5 py-3 font-medium">Module</th>
              <th className="px-5 py-3 font-medium">Assigned</th>
              <th className="px-5 py-3 font-medium">Completed</th>
              <th className="px-5 py-3 font-medium">Overdue</th>
              <th className="px-5 py-3 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody>
            {byModule.map((m) => {
              const pct = m.assigned ? Math.round((m.complete / m.assigned) * 100) : 0
              return (
                <tr key={m.title} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy-900">{m.title}</td>
                  <td className="px-5 py-3 text-navy-900">{m.assigned}</td>
                  <td className="px-5 py-3 text-navy-900">{m.complete}</td>
                  <td className={`px-5 py-3 font-semibold ${m.overdue ? 'text-danger' : 'text-navy-900'}`}>{m.overdue}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                        <div className="h-full rounded-full bg-lemon-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-navy-900">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {byModule.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-secondary-text">
                  No training assigned to your team yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
