import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Headset,
  Megaphone,
  Network,
  Plus,
  Presentation,
  Puzzle,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInstitutionOverview } from '../hooks/useInstitution'
import { useCampusContext } from '../context/CampusContext'
import { Button } from '../../../shared/components/Button'
import { DashboardSummaryCard } from '../../../shared/components/DashboardSummaryCard'
import { AnnouncementDashboardList } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ZoomIcon } from '../../../shared/components/ZoomIcon'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { TrendLineChart } from '../components/TrendLineChart'
import type {
  AssignmentSubmission,
  AttentionItem,
  CoursePerformanceItem,
  DeadlineItem,
  HelpDeskTicket,
  IntegrationStatusItem,
} from '../types'

const STAT = 17

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

function AttentionList({
  title,
  items,
}: {
  title: string
  items: AttentionItem[]
}) {
  const { tx } = useLanguage()
  const toneBySeverity = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  } as const

  return (
    <GlassCard className="p-4">
      <h3 className="text-[14px] font-bold text-navy-900 mb-3">{tx(title)}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-divider p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-semibold text-navy-900">{item.title}</p>
                <p className="text-[11.5px] text-secondary-text mt-1">{item.subtitle}</p>
              </div>
              <StatusPill label={item.severity} tone={toneBySeverity[item.severity]} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function deadlineTone(status: DeadlineItem['status']) {
  if (status === 'overdue') return 'danger'
  if (status === 'today') return 'warning'
  return 'info'
}

function performanceTone(status: CoursePerformanceItem['status']) {
  if (status === 'critical') return 'danger'
  if (status === 'watch') return 'warning'
  return 'success'
}

function performanceLabel(status: CoursePerformanceItem['status']) {
  if (status === 'critical') return 'Critical'
  if (status === 'watch') return 'Watch'
  return 'Healthy'
}

function ticketPriorityTone(priority: HelpDeskTicket['priority']) {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function ticketStatusTone(status: HelpDeskTicket['status']) {
  if (status === 'open') return 'warning'
  if (status === 'in-review') return 'info'
  return 'success'
}

function submissionStatusTone(status: AssignmentSubmission['status']) {
  if (status === 'late') return 'danger'
  if (status === 'pending') return 'warning'
  if (status === 'graded') return 'success'
  return 'info'
}

function integrationTone(status: IntegrationStatusItem['status']) {
  if (status === 'connected') return 'success'
  if (status === 'warning') return 'warning'
  return 'danger'
}

function integrationLabel(status: IntegrationStatusItem['status']) {
  if (status === 'connected') return 'Connected'
  if (status === 'warning') return 'Needs attention'
  return 'Disconnected'
}

export function InstitutionOverviewPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { setupPercent, setupSteps } = useCampusContext()
  const { data, isLoading, isError } = useInstitutionOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lemon-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-danger-bg text-danger rounded-xl border border-danger/30 text-center font-medium">
        Failed to load institution overview data. Please try again.
      </div>
    )
  }

  const totalProgress = data.progressOverview.reduce((sum, item) => sum + item.count, 0)
  const completed = data.progressOverview.find((item) => item.label === 'Completed')?.count ?? 0
  const completedPercent = totalProgress > 0 ? Math.round((completed / totalProgress) * 100) : 0
  let cumulative = 0
  const progressStops = data.progressOverview
    .map((item) => {
      const color =
        item.tone === 'success'
          ? '#A8D400'
          : item.tone === 'info'
            ? '#1976D2'
            : item.tone === 'warning'
              ? '#FFC107'
              : '#E53935'
      const start = cumulative
      cumulative += totalProgress > 0 ? (item.count / totalProgress) * 100 : 0
      return `${color} ${start}% ${cumulative}%`
    })
    .join(', ')

  const enrollmentBars = data.enrollmentTrend.map((point) => ({
    label: point.label,
    value: point.totalStudents,
  }))
  const activeBars = data.enrollmentTrend.map((point) => ({
    label: point.label,
    value: point.activeStudents,
  }))
  const completionTrend = data.kpiTrends.completionRate.map((value, index) => ({
    label: data.enrollmentTrend[index]?.label ?? `${index + 1}`,
    value,
  }))

  const totalStudentsTrend = getTrendFromSeries(data.kpiTrends.totalStudents)
  const activeStudentsTrend = getTrendFromSeries(data.kpiTrends.activeStudents)
  const activeCoursesTrend = getTrendFromSeries(data.kpiTrends.activeCourses)
  const instructorsTrend = getTrendFromSeries(data.kpiTrends.instructors)
  const completionRateTrend = getTrendFromSeries(data.kpiTrends.completionRate)
  const pendingApprovalsTrend = getTrendFromSeries(data.kpiTrends.pendingApprovals)
  const liveSessionsTrend = getTrendFromSeries(data.kpiTrends.upcomingLiveSessions)
  const certificatesTrend = getTrendFromSeries(data.kpiTrends.certificatesIssued)

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {setupPercent < 100 ? (
        <GlassCard className="p-4 border-lemon-500/30 bg-lemon-500/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-navy-900 flex items-center gap-2">
                <Network size={16} className="text-lemon-700" />
                Institution setup {setupPercent}% complete
              </p>
              <p className="text-[12px] text-secondary-text mt-1">
                {setupSteps.find((step) => !step.done)?.title ?? 'Finish onboarding'} —{' '}
                {setupSteps.find((step) => !step.done)?.subtitle ?? 'Configure your organization'}
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/admin/institution/structure')}>
              Continue Setup
            </Button>
          </div>
        </GlassCard>
      ) : null}

      <div>
        <h1 className="text-[22px] font-bold text-navy-900">
          {t('common.welcomeBack')} <span className="text-navy-700">Admin</span>
        </h1>
        <p className="text-[13px] text-secondary-text mt-1">
          Track institutional performance, learner progress and operational priorities for {data.institutionName}.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="outline-green" onClick={() => navigate('/admin/courses')}>
            <Plus size={15} />
            Create Course
          </Button>
          <Button variant="outline-blue" onClick={() => navigate('/admin/people')}>
            <UserPlus size={15} />
            Add Student
          </Button>
          <Button variant="outline-purple" onClick={() => navigate('/admin/people')}>
            <Presentation size={15} />
            Add Instructor
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/reports')}>
            <CalendarClock size={15} />
            Schedule Class
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/announcements')}>
            <Megaphone size={15} />
            Create Announcement
          </Button>
          <Button variant="primary" onClick={() => navigate('/admin/reports')}>
            <FileText size={15} />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Total Students"
          value={data.kpis.totalStudents.toLocaleString()}
          trend={totalStudentsTrend.trend}
          trendValue={totalStudentsTrend.trendValue}
          sparkline={data.kpiTrends.totalStudents}
          sparklineColor="#1976D2"
          icon={<Users size={STAT} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Active Students"
          value={data.kpis.activeStudents.toLocaleString()}
          sub="Last 7 days"
          trend={activeStudentsTrend.trend}
          trendValue={activeStudentsTrend.trendValue}
          sparkline={data.kpiTrends.activeStudents}
          sparklineColor="#16A34A"
          icon={<TrendingUp size={STAT} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Upcoming Live Sessions"
          value={data.kpis.upcomingLiveSessions}
          sub="Next 7 days"
          trend={liveSessionsTrend.trend}
          trendValue={liveSessionsTrend.trendValue}
          sparkline={data.kpiTrends.upcomingLiveSessions}
          sparklineColor="#2563EB"
          icon={<ZoomIcon size={STAT} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Certificates Issued"
          value={data.kpis.certificatesIssued.toLocaleString()}
          sub="This semester"
          trend={certificatesTrend.trend}
          trendValue={certificatesTrend.trendValue}
          sparkline={data.kpiTrends.certificatesIssued}
          sparklineColor="#A8D400"
          icon={<Award size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
        <StatBlock
          label="Active Courses"
          value={data.kpis.activeCourses}
          trend={activeCoursesTrend.trend}
          trendValue={activeCoursesTrend.trendValue}
          sparkline={data.kpiTrends.activeCourses}
          sparklineColor="#7C3AED"
          icon={<BookOpen size={STAT} />}
          iconBg="bg-navy-50 text-navy-700"
        />
        <StatBlock
          label="Instructors"
          value={data.kpis.instructors}
          trend={instructorsTrend.trend}
          trendValue={instructorsTrend.trendValue}
          sparkline={data.kpiTrends.instructors}
          sparklineColor="#2A3560"
          icon={<GraduationCap size={STAT} />}
          iconBg="bg-[#F5F3FF] text-[#7C3AED]"
        />
        <StatBlock
          label="Completion Rate"
          value={`${data.kpis.completionRate}%`}
          sub="Average course completion"
          trend={completionRateTrend.trend}
          trendValue={completionRateTrend.trendValue}
          sparkline={data.kpiTrends.completionRate}
          sparklineColor="#A8D400"
          icon={<CheckCircle2 size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
        <StatBlock
          label="Pending Approvals"
          value={data.kpis.pendingApprovals}
          sub="Enrollments and requests"
          trend={pendingApprovalsTrend.trend}
          trendValue={pendingApprovalsTrend.trendValue}
          sparkline={data.kpiTrends.pendingApprovals}
          sparklineColor="#E53935"
          icon={<ClipboardCheck size={STAT} />}
          iconBg="bg-warning-bg text-[#B45309]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <GlassCard className="p-5 flex flex-col h-full w-full">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-navy-900">Student Progress Overview</h3>
            <p className="text-[11.5px] text-secondary-text mt-1">Progress distribution across enrolled learners</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
            <div
              className="w-36 h-36 shrink-0 rounded-full grid place-items-center"
              style={{
                background: `conic-gradient(${progressStops})`,
              }}
            >
              <div className="w-24 h-24 rounded-full soft-surface grid place-items-center text-center">
                <div>
                  <div className="text-[22px] font-extrabold text-navy-900">{completedPercent}%</div>
                  <div className="text-[9px] text-secondary-text font-semibold uppercase tracking-wide">Completed</div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              {data.progressOverview.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.tone === 'success'
                          ? 'bg-lemon-500'
                          : item.tone === 'info'
                            ? 'bg-info'
                            : item.tone === 'warning'
                              ? 'bg-warning'
                              : 'bg-danger'
                      }`}
                    />
                    <span className="text-secondary-text font-semibold">{item.label}</span>
                  </div>
                  <span className="text-navy-900 font-bold">{item.count.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 text-[11px] text-secondary-text">Total learners: {totalProgress.toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>

        <TrendLineChart
          title="Student Enrollment Trend"
          subtitle="Total enrolled learners over the last 6 months"
          data={enrollmentBars}
          color="#1976D2"
        />

        <TrendLineChart
          title="Active Student Trend"
          subtitle="Weekly active learners over the last 6 months"
          data={activeBars}
          color="#16A34A"
        />

        <TrendLineChart
          title="Completion Rate Trend"
          subtitle="Average course completion over the last 6 months"
          data={completionTrend}
          color="#A8D400"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DashboardSummaryCard title="Top Courses" onViewAll={() => navigate('/admin/courses')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                    <th className="py-2 pr-2 font-semibold">Course</th>
                    <th className="py-2 px-2 font-semibold">Instructor</th>
                    <th className="py-2 px-2 font-semibold">Enrolled</th>
                    <th className="py-2 px-2 font-semibold">Completion</th>
                    <th className="py-2 pl-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coursePerformance.map((course) => (
                    <tr key={course.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-navy-900">{course.title}</div>
                        <div className="text-[10.5px] text-secondary-text mt-0.5">{course.courseCode}</div>
                      </td>
                      <td className="py-2.5 px-2 text-navy-700">{course.instructor}</td>
                      <td className="py-2.5 px-2 font-semibold text-navy-900">{course.enrolled}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-navy-50 w-20 overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${course.completionRate}%` }} />
                          </div>
                          <span className="font-semibold text-navy-900">{course.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pl-2">
                        <StatusPill label={performanceLabel(course.status)} tone={performanceTone(course.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Assignment Submissions" onViewAll={() => navigate('/admin/assignments')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                    <th className="py-2 pr-2 font-semibold">Assignment</th>
                    <th className="py-2 px-2 font-semibold">Student</th>
                    <th className="py-2 px-2 font-semibold">Submitted</th>
                    <th className="py-2 pl-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignmentSubmissions.map((item) => (
                    <tr key={item.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-navy-900">{item.assignment}</div>
                        <div className="text-[10.5px] text-secondary-text mt-0.5">{item.course}</div>
                      </td>
                      <td className="py-2.5 px-2 text-navy-700">{item.student}</td>
                      <td className="py-2.5 px-2 text-secondary-text">{item.submittedAt}</td>
                      <td className="py-2.5 pl-2">
                        <StatusPill label={item.status} tone={submissionStatusTone(item.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSummaryCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AttentionList title="Pending Enrollments" items={data.pendingEnrollments} />
            <AttentionList title="Learners At Risk" items={data.learnersAtRisk} />
            <AttentionList title="Overdue Assignments & Exams" items={data.overdueAssessments} />
            <AttentionList title="Courses Requiring Attention" items={data.coursesRequiringAttention} />
          </div>
        </div>

        <div className="space-y-4">
          <DashboardSummaryCard title="Calendar" onViewAll={() => navigate('/admin/calendar')}>
            <div className="space-y-2.5">
              {data.calendarEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-navy-900 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-lemon-500 font-bold leading-none">{event.month}</span>
                    <span className="text-[14px] font-bold text-white leading-none mt-0.5">{event.day}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-navy-900 truncate">{event.title}</p>
                    <p className="text-[10.5px] text-secondary-text truncate">{event.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Announcements" onViewAll={() => navigate('/admin/announcements')}>
            <AnnouncementDashboardList
              items={data.recentAnnouncements.map((announcement) => ({
                id: announcement.id,
                title: announcement.title,
                body: announcement.body ?? '',
                postedAt: announcement.postedAt,
                priority: announcement.priority,
                audience: announcement.audience,
              }))}
              emptyMessage="No announcements yet. Publish one from the announcements page."
            />
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Upcoming Live Sessions" onViewAll={() => navigate('/admin/live-classes')}>
            <div className="space-y-2">
              {data.upcomingLiveClasses.map((item) => (
                <div key={item.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-info-bg flex items-center justify-center shrink-0">
                      <ZoomIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{item.title}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">{item.course} · {item.instructor}</p>
                      <p className="text-[10.5px] text-navy-700 mt-0.5">{item.date} · {item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Help Desk Tickets" onViewAll={() => navigate('/admin/help-desk')}>
            <div className="space-y-2">
              {data.helpDeskTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-warning-bg text-[#B45309] flex items-center justify-center shrink-0">
                      <Headset size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{ticket.subject}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">{ticket.requester} · {ticket.updatedAt}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <StatusPill label={ticket.priority} tone={ticketPriorityTone(ticket.priority)} />
                        <StatusPill label={ticket.status} tone={ticketStatusTone(ticket.status)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="System Integrations" onViewAll={() => navigate('/admin/api-integrations')}>
            <div className="space-y-2">
              {data.integrationStatus.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between gap-2 rounded-lg border border-divider p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                      <Puzzle size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{integration.name}</p>
                      <p className="text-[10.5px] text-secondary-text">Last sync · {integration.lastSync}</p>
                    </div>
                  </div>
                  <StatusPill label={integrationLabel(integration.status)} tone={integrationTone(integration.status)} />
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Upcoming Deadlines" onViewAll={() => navigate('/admin/calendar')}>
            <div className="space-y-2">
              {data.upcomingDeadlines.map((item) => (
                <div key={item.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{item.title}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">{item.course}</p>
                      <p className="text-[10.5px] text-navy-700 mt-0.5">{item.dueIn}</p>
                    </div>
                    <StatusPill label={item.status} tone={deadlineTone(item.status)} />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Recent Activity">
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 rounded-lg border border-divider p-2.5">
                  <AlertTriangle size={13} className="text-info mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-navy-900 font-medium">{activity.text}</p>
                    <p className="text-[10.5px] text-secondary-text mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>
        </div>
      </div>

      <GlassCard className="p-3 bg-info-bg/40 border-info/20">
        <div className="flex items-center gap-2 text-[12px] text-navy-700">
          <AlertTriangle size={14} className="text-info" />
          This dashboard is scoped to your institution only. Platform-level and multi-tenant administration data is intentionally excluded.
        </div>
      </GlassCard>
    </div>
  )
}
