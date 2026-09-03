import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Megaphone,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCorporateOverview } from '../hooks/useCorporateOverview'
import { Button } from '../../../shared/components/Button'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { AnnouncementDashboardList } from '../../../shared/components/announcements/AnnouncementFeedCard'
import type { AttentionItem } from '../../institution/types'

const STAT = 17

const WORKFLOW_STEPS = [
  'HR creates training',
  'Assign training to employees',
  'Employee receives notification',
  'Employee takes course',
  'Employee completes assessment',
  'Certificate issued',
  'Compliance status updated',
  'Manager sees report',
]

function getTrendFromSeries(data: number[]) {
  if (data.length < 2) return { trend: 'up' as const, trendValue: '0%' }
  const first = data[0]
  const last = data[data.length - 1]
  const change = first === 0 ? 0 : ((last - first) / first) * 100
  return {
    trend: change >= 0 ? ('up' as const) : ('down' as const),
    trendValue: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
  }
}

function AttentionList({ title, items }: { title: string; items: AttentionItem[] }) {
  const toneBySeverity = { low: 'info', medium: 'warning', high: 'danger' } as const
  return (
    <GlassCard className="p-4">
      <h3 className="text-[14px] font-bold text-navy-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-[12px] text-secondary-text">No items need attention right now.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-divider p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12.5px] font-semibold text-navy-900">{item.title}</p>
                  <p className="text-[11.5px] text-secondary-text mt-1">{item.subtitle}</p>
                </div>
                <StatusPill label={item.severity} tone={toneBySeverity[item.severity]} />
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}

export function CorporateOverviewPage() {
  const navigate = useNavigate()
  const data = useCorporateOverview()

  const kpiCards = [
    { label: 'Employees', value: data.kpis.totalEmployees, icon: <Users size={STAT} />, key: 'totalEmployees' as const },
    { label: 'Training Assigned', value: data.kpis.trainingAssigned, icon: <BookOpen size={STAT} />, key: 'trainingAssigned' as const },
    { label: 'Completed', value: data.kpis.completedTraining, icon: <CheckCircle2 size={STAT} />, key: 'completedTraining' as const },
    { label: 'Overdue', value: data.kpis.overdueTraining, icon: <Clock3 size={STAT} />, key: 'overdueTraining' as const },
    { label: 'Compliance', value: `${data.kpis.complianceRate}%`, icon: <ClipboardCheck size={STAT} />, key: 'complianceRate' as const },
    { label: 'Certifications', value: data.kpis.certificationsIssued, icon: <Award size={STAT} />, key: 'certificationsIssued' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-navy-900 leading-tight tracking-tight">
            Corporate Training Dashboard
          </h1>
          <p className="text-[13px] text-secondary-text mt-1">
            {data.organizationName} · {data.organizationSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/training-assignments')}>
            Assign training
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/compliance')}>
            View compliance
          </Button>
          <Button onClick={() => navigate('/admin/employees')}>
            Add employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const trend = getTrendFromSeries(data.kpiTrends[card.key])
          return (
            <StatBlock
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={card.value}
              trend={trend.trend}
              trendValue={trend.trendValue}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-4 lg:col-span-2">
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Training workflow</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-lg border border-divider px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lemon-500/15 text-[11px] font-bold text-navy-900">
                  {index + 1}
                </span>
                <span className="text-[12.5px] text-navy-900">{step}</span>
                {index < WORKFLOW_STEPS.length - 1 && index % 2 === 1 ? (
                  <ArrowRight size={14} className="ml-auto text-secondary-text hidden sm:block" />
                ) : null}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Training progress</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.trainingProgress.map((item) => (
              <div key={item.label} className="rounded-lg border border-divider p-3">
                <p className="text-[11px] text-secondary-text uppercase tracking-wide">{item.label}</p>
                <p className="text-[20px] font-bold text-navy-900 mt-1">{item.count}</p>
              </div>
            ))}
          </div>
          {data.kpis.inProgress > 0 ? (
            <p className="text-[11.5px] text-secondary-text mt-3 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              {data.kpis.inProgress} assignment{data.kpis.inProgress === 1 ? '' : 's'} in progress
            </p>
          ) : null}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttentionList title="Needs attention" items={data.attentionItems} />
        <GlassCard className="p-4">
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Manager reporting</h3>
          <p className="text-[12.5px] text-secondary-text mb-4">
            Track assigned learning, completion rates, overdue training, and skills compliance across departments and teams.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/reports')}>
              Open reports
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/job-roles')}>
              Job roles
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/skills')}>
              Skills catalog
            </Button>
          </div>
        </GlassCard>
      </div>

      {data.recentAnnouncements.length > 0 ? (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[14px] font-bold text-navy-900 flex items-center gap-2">
              <Megaphone size={16} />
              Recent announcements
            </h3>
            <Button variant="secondary" onClick={() => navigate('/admin/announcements')}>
              View all
            </Button>
          </div>
          <AnnouncementDashboardList
            items={data.recentAnnouncements.map((announcement) => ({
              id: announcement.id,
              title: announcement.title,
              body: announcement.body ?? '',
              postedAt: announcement.postedAt,
              priority: announcement.priority,
              audience: announcement.audience,
            }))}
          />
        </GlassCard>
      ) : null}
    </div>
  )
}
