import { AlarmClock, Award, BellRing, Loader2, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { ALERT_LABEL, alertDetail } from '../../corporate/utils/complianceLabels'
import { useRemind } from '../components/useRemind'
import { useManagedTeam } from '../hooks/useManagedTeam'

const STAT = 17

export function ManagerDashboardPage() {
  const { me, teams, members, rows, alerts, certificates, complianceRate } = useManagedTeam()
  const { remind, sendingId } = useRemind()

  const overdue = rows.filter((r) => r.status === 'overdue').length
  const dueSoon = rows.reduce((sum, r) => sum + r.dueSoonTraining, 0)
  const today = new Date().toISOString().slice(0, 10)
  const expiringSoon = certificates.filter((c) => {
    if (c.status !== 'issued' || !c.expirationDate) return false
    const days = (Date.parse(c.expirationDate) - Date.parse(today)) / 86_400_000
    return days >= 0 && days <= 30
  }).length

  if (!teams.length) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Welcome, ${me?.name.split(' ')[0] ?? ''}`} subtitle="Your team's training at a glance." />
        <GlassCard className="p-8 text-center">
          <UsersRound size={30} className="mx-auto mb-3 text-navy-300" />
          <p className="text-[14px] font-semibold text-navy-900">You do not manage a team yet</p>
          <p className="mt-1 text-[12.5px] text-secondary-text">
            Ask your learning admin to set you as the manager of a team on the Teams page.
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={`Welcome, ${me?.name.split(' ')[0] ?? ''}`}
        subtitle={`Training compliance for ${teams.map((t) => t.name).join(', ')}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatBlock label="Team members" value={members.length} icon={<UsersRound size={STAT} />} />
        <StatBlock
          label="Compliance"
          value={`${complianceRate}%`}
          sub="Members fully up to date"
          icon={<ShieldCheck size={STAT} />}
          iconBg={complianceRate >= 80 ? 'bg-success-bg text-success' : 'bg-warning-bg text-[#8A6D00]'}
        />
        <StatBlock label="Overdue" value={overdue} sub="Members with late training" icon={<TriangleAlert size={STAT} />} iconBg="bg-danger-bg text-danger" />
        <StatBlock label="Due soon" value={dueSoon} sub="Within 14 days" icon={<AlarmClock size={STAT} />} iconBg="bg-warning-bg text-[#8A6D00]" />
        <StatBlock label="Expiring" value={expiringSoon} sub="Certifications in 30 days" icon={<Award size={STAT} />} iconBg="bg-info-bg text-info" />
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-navy-900">Needs attention</h2>
            <p className="text-[12px] text-secondary-text">Late first, then unassigned, due soon and renewals.</p>
          </div>
          <Link to="/manager/team" className="text-[12.5px] font-bold text-lemon-700 dark:text-lemon-500">
            View team →
          </Link>
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-secondary-text">
            Nothing needs attention — your team is up to date.
          </p>
        ) : (
          <ul className="divide-y divide-divider">
            {alerts.slice(0, 12).map((alert, i) => (
              <li key={`${alert.employeeId}-${alert.courseId}-${i}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <StatusPill label={ALERT_LABEL[alert.kind].label} tone={ALERT_LABEL[alert.kind].tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-navy-900">
                    {alert.employeeName} · {alert.courseTitle}
                  </p>
                  <p className="text-[12px] text-secondary-text">{alertDetail(alert)}</p>
                </div>
                {alert.kind === 'overdue' || alert.kind === 'due-soon' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void remind(alert.employeeId)}
                    disabled={sendingId === alert.employeeId}
                  >
                    {sendingId === alert.employeeId ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                    Remind
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}
