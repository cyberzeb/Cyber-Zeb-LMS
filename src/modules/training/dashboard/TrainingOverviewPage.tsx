import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Megaphone,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTrainingOverview } from '../hooks/useTrainingOverview'
import { Button } from '../../../shared/components/Button'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { AnnouncementDashboardList } from '../../../shared/components/announcements/AnnouncementFeedCard'
import type { AttentionItem } from '../../institution/types'

const STAT = 17

const WORKFLOW_STEPS = [
  'Create training program',
  'Schedule a cohort',
  'Assign trainer',
  'Enroll learners',
  'Deliver training',
  'Issue certificates',
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

export function TrainingOverviewPage() {
  const navigate = useNavigate()
  const data = useTrainingOverview()

  const kpiCards = [
    { label: 'Learners', value: data.kpis.totalLearners, icon: <Users size={STAT} />, key: 'totalLearners' as const },
    { label: 'Programs', value: data.kpis.trainingPrograms, icon: <BookOpen size={STAT} />, key: 'trainingPrograms' as const },
    { label: 'Active Cohorts', value: data.kpis.activeCohorts, icon: <Clock3 size={STAT} />, key: 'activeCohorts' as const },
    { label: 'Trainers', value: data.kpis.trainers, icon: <CheckCircle2 size={STAT} />, key: 'trainers' as const },
    { label: 'Completion Rate', value: `${data.kpis.completionRate}%`, icon: <Award size={STAT} />, key: 'completionRate' as const },
    { label: 'Certificates', value: data.kpis.certificatesIssued, icon: <Award size={STAT} />, key: 'certificatesIssued' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-navy-900 leading-tight tracking-tight">
            Training Organization Dashboard
          </h1>
          <p className="text-[13px] text-secondary-text mt-1">
            {data.organizationName} · {data.organizationSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/cohorts')}>
            Manage cohorts
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/learners')}>
            View learners
          </Button>
          <Button onClick={() => navigate('/admin/programs')}>
            Add program
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
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Training delivery workflow</h3>
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
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Cohort progress</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.cohortProgress.map((item) => (
              <div key={item.label} className="rounded-lg border border-divider p-3">
                <p className="text-[11px] text-secondary-text uppercase tracking-wide">{item.label}</p>
                <p className="text-[20px] font-bold text-navy-900 mt-1">{item.count}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttentionList title="Needs attention" items={data.attentionItems} />
        <GlassCard className="p-4">
          <h3 className="text-[14px] font-bold text-navy-900 mb-3">Training management</h3>
          <p className="text-[12.5px] text-secondary-text mb-4">
            Manage your training divisions, specialized programs, cohorts, learners, and track their progress through certificates.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/divisions')}>
              Divisions
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/trainers')}>
              Trainers
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/certificates')}>
              Certificates
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
