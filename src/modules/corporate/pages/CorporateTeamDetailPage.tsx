/**
 * Team / manager view.
 *
 * What a team lead needs to see about their people: who is on the team, what
 * training each of them owes, and who is late. Reached from Teams, and it is
 * also what a manager lands on from their own dashboard.
 */
import { useMemo } from 'react'
import { ArrowLeft, ShieldCheck, TriangleAlert, UserRound, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { useCampusContext } from '../../institution/context/CampusContext'
import { useTeams } from '../hooks/useTeams'
import { useRequiredTraining } from '../hooks/useRequiredTraining'
import { computeOrganizationComplianceRate } from '../utils/complianceUtils'
import type { ComplianceStatus } from '../types'

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

export function CorporateTeamDetailPage() {
  const { teamId = '' } = useParams()
  const { teams } = useTeams()
  const { departments } = useCampusContext()
  const { activeEmployees, complianceRows, alerts } = useRequiredTraining()

  const team = teams.find((t) => t.id === teamId)

  const members = useMemo(
    () => activeEmployees.filter((p) => p.teamId === teamId),
    [activeEmployees, teamId],
  )

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members])

  const memberRows = useMemo(
    () => complianceRows.filter((row) => memberIds.has(row.employeeId)),
    [complianceRows, memberIds],
  )

  const teamAlerts = useMemo(
    () => alerts.filter((a) => memberIds.has(a.employeeId)),
    [alerts, memberIds],
  )

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Team not found" subtitle="This team may have been removed." />
        <Link
          to="/admin/corporate/teams"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-lemon-700 dark:text-lemon-500 hover:underline"
        >
          <ArrowLeft size={15} /> Back to teams
        </Link>
      </div>
    )
  }

  const manager = team.managerId
    ? activeEmployees.find((p) => p.id === team.managerId) ??
      // A manager may be an instructor or admin rather than an employee record.
      undefined
    : undefined
  const departmentName = departments.find((d) => d.id === team.departmentId)?.name ?? '—'
  const complianceRate = computeOrganizationComplianceRate(memberRows)
  const overdueMembers = memberRows.filter((r) => r.status === 'overdue').length

  return (
    <div className="space-y-6">
      <Link
        to="/admin/corporate/teams"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-secondary-text hover:text-navy-900"
      >
        <ArrowLeft size={15} /> Teams
      </Link>

      <PageHeader
        title={team.name}
        subtitle={`${departmentName}${team.description ? ` — ${team.description}` : ''}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatBlock icon={<Users size={STAT} />} label="Team members" value={members.length} />
        <StatBlock
          icon={<ShieldCheck size={STAT} />}
          label="Team compliance"
          value={`${complianceRate}%`}
        />
        <StatBlock
          icon={<TriangleAlert size={STAT} />}
          label="Members overdue"
          value={overdueMembers}
        />
        <StatBlock
          icon={<UserRound size={STAT} />}
          label="Manager"
          value={manager?.name ?? 'Unassigned'}
        />
      </div>

      {teamAlerts.length > 0 ? (
        <GlassCard className="p-0 overflow-hidden">
          <div className="border-b border-divider px-4 py-3">
            <h2 className="text-[13px] font-bold text-navy-900">Needs your attention</h2>
          </div>
          <ul className="divide-y divide-divider/60 max-h-64 overflow-y-auto app-scroll">
            {teamAlerts.slice(0, 25).map((alert) => (
              <li
                key={`${alert.employeeId}-${alert.courseId}-${alert.kind}`}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span className="min-w-0 flex-1 truncate font-semibold text-navy-900">
                  {alert.employeeName}
                </span>
                <span className="min-w-0 flex-1 truncate text-secondary-text">
                  {alert.courseTitle}
                </span>
                <StatusPill
                  label={alert.kind === 'due-soon' ? 'due soon' : alert.kind}
                  tone={alert.kind === 'overdue' ? 'danger' : 'warning'}
                />
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-divider bg-navy-50/40 text-[11px] uppercase tracking-wide text-secondary-text">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Job role</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {memberRows.map((row) => (
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
                  <StatusPill label={statusLabel[row.status]} tone={statusTone[row.status]} />
                </td>
              </tr>
            ))}
            {memberRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-secondary-text">
                  No employees are assigned to this team yet. Set a team on an employee&rsquo;s
                  record to see them here.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
