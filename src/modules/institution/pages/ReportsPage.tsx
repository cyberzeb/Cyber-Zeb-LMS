import { GlassCard } from '../../../shared/layout/GlassCard'
import { StatBlock } from '../../../shared/components/StatBlock'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { ReportCategoryCard } from '../components/ReportCategoryCard'
import { GeneratedReportsList } from '../components/GeneratedReportsList'
import { MiniBarChart } from '../components/MiniBarChart'
import type { ReportCategory, GeneratedReport, TrendPoint } from '../types'

const categories: ReportCategory[] = [
  {
    id: 'r1',
    title: 'Academic Performance',
    description: 'Grades, GPA distribution, progression and transcripts.',
    icon: '🎓',
    reportCount: 12,
  },
  {
    id: 'r2',
    title: 'Attendance',
    description: 'Class and session attendance, absences and risk alerts.',
    icon: '📅',
    reportCount: 8,
  },
  {
    id: 'r3',
    title: 'Financial',
    description: 'Invoices, payments, refunds and revenue reconciliation.',
    icon: '💳',
    reportCount: 10,
  },
  {
    id: 'r4',
    title: 'Engagement',
    description: 'Logins, activity, course completion and content usage.',
    icon: '📈',
    reportCount: 9,
  },
  {
    id: 'r5',
    title: 'Compliance & Audit',
    description: 'Access logs, policy acknowledgment and audit trails.',
    icon: '🛡️',
    reportCount: 6,
  },
  {
    id: 'r6',
    title: 'Instructor Activity',
    description: 'Teaching load, grading turnaround and responsiveness.',
    icon: '🧑‍🏫',
    reportCount: 7,
  },
]

const enrollmentTrend: TrendPoint[] = [
  { label: 'Mar', value: 1720 },
  { label: 'Apr', value: 1810 },
  { label: 'May', value: 1890 },
  { label: 'Jun', value: 1940 },
  { label: 'Jul', value: 2005 },
  { label: 'Aug', value: 2066 },
]

const completionTrend: TrendPoint[] = [
  { label: 'CS', value: 94 },
  { label: 'Bus', value: 88 },
  { label: 'Eng', value: 81 },
  { label: 'Soc', value: 76 },
  { label: 'Cert', value: 92 },
]

const recentReports: GeneratedReport[] = [
  {
    id: 'g1',
    name: 'Fall Semester Grade Distribution',
    category: 'Academic Performance',
    generatedOn: 'Aug 1, 2026',
    format: 'PDF',
    status: 'ready',
  },
  {
    id: 'g2',
    name: 'Monthly Attendance Summary — July',
    category: 'Attendance',
    generatedOn: 'Jul 31, 2026',
    format: 'Excel',
    status: 'ready',
  },
  {
    id: 'g3',
    name: 'Q2 Revenue Reconciliation',
    category: 'Financial',
    generatedOn: 'Jul 30, 2026',
    format: 'Excel',
    status: 'ready',
  },
  {
    id: 'g4',
    name: 'Learner Engagement Heatmap',
    category: 'Engagement',
    generatedOn: 'In progress',
    format: 'CSV',
    status: 'processing',
  },
  {
    id: 'g5',
    name: 'Weekly Audit Trail Export',
    category: 'Compliance & Audit',
    generatedOn: 'Scheduled · Aug 5',
    format: 'PDF',
    status: 'scheduled',
  },
]

export function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate, schedule and export academic, financial and operational insights."
        actions={
          <>
            <Button variant="secondary">Schedule Report</Button>
            <Button variant="primary">+ New Report</Button>
          </>
        }
      />

      <GlassCard className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-divider/40">
        <StatBlock label="Reports Generated" value="1,284" sub="This year" icon="📑" />
        <StatBlock label="Scheduled" value="14" sub="Auto-delivery" icon="⏰" iconBg="bg-info-bg" />
        <StatBlock label="Avg. Completion" value="86%" icon="✅" />
        <StatBlock
          label="Active Learners"
          value="2,066"
          sub="+3% vs last month"
          icon="📈"
          iconBg="bg-warning-bg"
        />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
        <MiniBarChart
          title="Enrollment Growth"
          subtitle="Active learners over the last 6 months"
          data={enrollmentTrend}
        />
        <MiniBarChart
          title="Completion Rate by Department"
          subtitle="Course completion percentage"
          data={completionTrend}
          unit="%"
        />
      </div>

      <div>
        <h2 className="text-[15px] font-extrabold text-navy-900 mb-4">Report Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {categories.map((category) => (
            <ReportCategoryCard
              key={category.id}
              category={category}
              onOpen={(c) => console.log('Open report category', c.id)}
            />
          ))}
        </div>
      </div>

      <GeneratedReportsList
        reports={recentReports}
        onDownload={(r) => console.log('Download report', r.id)}
      />
    </div>
  )
}
