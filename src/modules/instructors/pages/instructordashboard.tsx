import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Headset,
  Megaphone,
  MonitorPlay,
  RefreshCw,
  SquarePen,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { DashboardSummaryCard } from '../../../shared/components/DashboardSummaryCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ZoomIcon } from '../../../shared/components/ZoomIcon'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { TrendLineChart } from '../../institution/components/TrendLineChart'
import { InstructorPageLoading } from '../components/InstructorPageStates'
import { InstructorProfileCard } from '../components/InstructorProfileCard'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { AssignmentSubmission, UpcomingTask } from '../types'

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

function taskTone(status: UpcomingTask['status']) {
  if (status === 'overdue') return 'danger'
  if (status === 'today') return 'warning'
  return 'info'
}

function assignmentStatusTone(status: AssignmentSubmission['status']) {
  if (status === 'Pending review') return 'warning'
  if (status === 'Graded') return 'success'
  return 'neutral'
}

export function InstructorDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, reload } = useInstructorDashboard()

  if (isLoading) return <InstructorPageLoading />

  if (isError || !data) {
    return (
      <GlassCard className="p-5 border-danger/30 bg-danger-bg text-danger">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">Failed to load the instructor dashboard</h2>
            <p className="mt-1 text-[13px] leading-6 text-danger/80">
              {error?.message ?? 'Please try again to load your teaching workspace.'}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-[12px] font-semibold text-white transition hover:opacity-90"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        </div>
      </GlassCard>
    )
  }

  const totalWorkload = data.workloadOverview.reduce((sum, item) => sum + item.count, 0)
  const graded = data.workloadOverview.find((item) => item.label === 'Graded')?.count ?? 0
  const gradedPercent = totalWorkload > 0 ? Math.round((graded / totalWorkload) * 100) : 0

  let cumulative = 0
  const progressStops = data.workloadOverview
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
      cumulative += totalWorkload > 0 ? (item.count / totalWorkload) * 100 : 0
      return `${color} ${start}% ${cumulative}%`
    })
    .join(', ')

  const scoreTrend = getTrendFromSeries(data.kpiTrends.classAvgScore)
  const gradingTrend = getTrendFromSeries(data.kpiTrends.submissionsGraded)
  const attendanceTrend = getTrendFromSeries(data.kpiTrends.attendanceRate)
  const studentsTrend = getTrendFromSeries(data.kpiTrends.activeStudents)
  const sessionsTrend = getTrendFromSeries([2, 2, 3, 2, 4, data.kpis.upcomingSessions])

  const overdueCount = data.upcomingTasks.filter((t) => t.status === 'overdue').length
  const firstName = data.instructorName.replace(/^Dr\.\s|^Prof\.\s/, '').split(' ')[0]

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {overdueCount > 0 ? (
        <GlassCard className="p-4 border-danger/30 bg-danger-bg/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-navy-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger" />
                {overdueCount} overdue task{overdueCount === 1 ? '' : 's'} need attention
              </p>
              <p className="text-[12px] text-secondary-text mt-1">
                Review pending grading and publishing tasks for {data.term}.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/instructor/assignments')}>
              Review submissions
            </Button>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4 md:gap-5 items-start">
        <InstructorProfileCard data={data} />

        <div className="flex flex-col gap-4 md:gap-5 min-w-0">
          <div>
            <h1 className="text-[22px] font-bold text-navy-900">
              Welcome back, <span className="text-navy-700">{firstName}</span>
            </h1>
            <p className="text-[13px] text-secondary-text mt-1">
              Manage your courses, grade submissions, and track student performance across {data.department} · {data.term}.
            </p>
            <p className="text-[12px] text-lemon-700 font-semibold mt-1.5">{data.specialization}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button variant="outline-green" onClick={() => navigate('/instructor/live-classes')}>
                <MonitorPlay size={15} />
                Start live class
              </Button>
              <Button variant="outline-blue" onClick={() => navigate('/instructor/assignments')}>
                <SquarePen size={15} />
                Grade submissions
              </Button>
              <Button variant="outline-purple" onClick={() => navigate('/instructor/quizzes')}>
                <ClipboardList size={15} />
                Manage quizzes
              </Button>
              <Button variant="secondary" onClick={() => navigate('/instructor/calendar')}>
                <CalendarClock size={15} />
                View calendar
              </Button>
              <Button variant="secondary" onClick={() => navigate('/instructor/students')}>
                <Users size={15} />
                Student roster
              </Button>
              <Button variant="primary" onClick={() => navigate('/instructor/grades')}>
                <GraduationCap size={15} />
                Open gradebook
              </Button>
            </div>
          </div>

          <DashboardSummaryCard title="Upcoming Tasks" onViewAll={() => navigate('/instructor/calendar')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.upcomingTasks.map((item) => (
                <div key={item.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{item.title}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">{item.course}</p>
                      <p className="text-[10.5px] text-navy-700 mt-0.5">{item.dueIn}</p>
                    </div>
                    <StatusPill label={item.status} tone={taskTone(item.status)} />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Active Courses"
          value={data.kpis.activeCourses}
          sub="Teaching this term"
          trend={scoreTrend.trend}
          trendValue={scoreTrend.trendValue}
          sparkline={data.kpiTrends.classAvgScore}
          sparklineColor="#7C3AED"
          icon={<BookOpen size={STAT} />}
          iconBg="bg-navy-50 text-navy-700"
        />
        <StatBlock
          label="Total Students"
          value={data.kpis.totalStudents}
          sub="Across all courses"
          trend={studentsTrend.trend}
          trendValue={studentsTrend.trendValue}
          sparkline={data.kpiTrends.activeStudents}
          sparklineColor="#A8D400"
          icon={<Users size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
        <StatBlock
          label="Avg. Class Score"
          value={`${data.kpis.avgClassScore}%`}
          sub="Across graded work"
          trend={scoreTrend.trend}
          trendValue={scoreTrend.trendValue}
          sparkline={data.kpiTrends.classAvgScore}
          sparklineColor="#1976D2"
          icon={<CheckCircle2 size={STAT} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Class Attendance"
          value={`${data.kpiTrends.attendanceRate.at(-1)}%`}
          sub="Average across courses"
          trend={attendanceTrend.trend}
          trendValue={attendanceTrend.trendValue}
          sparkline={data.kpiTrends.attendanceRate}
          sparklineColor="#16A34A"
          icon={<UserRoundCheck size={STAT} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Pending Grading"
          value={data.kpis.pendingGrading}
          sub="Submissions to review"
          sparkline={[15, 18, 20, 22, 24, data.kpis.pendingGrading]}
          sparklineColor="#E53935"
          icon={<SquarePen size={STAT} />}
          iconBg="bg-warning-bg text-[#B45309]"
        />
        <StatBlock
          label="Upcoming Sessions"
          value={data.kpis.upcomingSessions}
          sub="Live classes next 7 days"
          trend={sessionsTrend.trend}
          trendValue={sessionsTrend.trendValue}
          sparkline={[2, 2, 3, 2, 4, data.kpis.upcomingSessions]}
          sparklineColor="#2563EB"
          icon={<ZoomIcon size={STAT} />}
          iconBg="bg-[#E8F3FF] text-info"
        />
        <StatBlock
          label="Graded Items"
          value={data.kpiTrends.submissionsGraded.at(-1) ?? 0}
          sub="This term"
          trend={gradingTrend.trend}
          trendValue={gradingTrend.trendValue}
          sparkline={data.kpiTrends.submissionsGraded}
          sparklineColor="#2A3560"
          icon={<GraduationCap size={STAT} />}
          iconBg="bg-navy-50 text-navy-700"
        />
        <StatBlock
          label="Office Hours"
          value={data.kpis.officeHoursWeekly}
          sub="Sessions per week"
          sparkline={data.kpiTrends.sessionsHeld}
          sparklineColor="#A8D400"
          icon={<TrendingUp size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <GlassCard className="p-5 flex flex-col h-full w-full">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-navy-900">Grading Workload Overview</h3>
            <p className="text-[11.5px] text-secondary-text mt-1">
              Breakdown of submissions and grading tasks this term
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
            <div
              className="w-36 h-36 shrink-0 rounded-full grid place-items-center"
              style={{ background: `conic-gradient(${progressStops})` }}
            >
              <div className="w-24 h-24 rounded-full bg-white grid place-items-center text-center">
                <div>
                  <div className="text-[22px] font-extrabold text-navy-900">{gradedPercent}%</div>
                  <div className="text-[9px] text-secondary-text font-semibold uppercase tracking-wide">
                    Graded
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              {data.workloadOverview.map((item) => (
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
                  <span className="text-navy-900 font-bold">{item.count}</span>
                </div>
              ))}
              <div className="pt-2 text-[11px] text-secondary-text">
                Total tracked items: {totalWorkload}
              </div>
            </div>
          </div>
        </GlassCard>

        <TrendLineChart
          title="Class Score Trend"
          subtitle="Average class performance over the last 6 months"
          data={data.classScoreTrend}
          color="#A8D400"
          unit="%"
        />

        <TrendLineChart
          title="Grading Progress"
          subtitle="Submissions graded over the last 6 weeks"
          data={data.gradingTrend}
          color="#1976D2"
          unit=""
        />

        <TrendLineChart
          title="Attendance Trend"
          subtitle="Class attendance rate over the last 6 months"
          data={data.attendanceTrend}
          color="#16A34A"
          unit="%"
        />

        <TrendLineChart
          title="Forum Engagement"
          subtitle="Student discussion activity over the last 6 weeks"
          data={data.engagementTrend}
          color="#7C3AED"
          unit=""
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DashboardSummaryCard title="My Courses" onViewAll={() => navigate('/instructor/courses')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                    <th className="py-2 pr-2 font-semibold">Course</th>
                    <th className="py-2 px-2 font-semibold">Students</th>
                    <th className="py-2 px-2 font-semibold">Next Session</th>
                    <th className="py-2 px-2 font-semibold">Progress</th>
                    <th className="py-2 pl-2 font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.filter((c) => c.status === 'active').map((course) => (
                    <tr key={course.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-navy-900">{course.title}</div>
                        <div className="text-[10.5px] text-secondary-text mt-0.5">{course.code}</div>
                      </td>
                      <td className="py-2.5 px-2 text-navy-700">{course.enrolledCount}</td>
                      <td className="py-2.5 px-2 text-secondary-text">{course.nextSession}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-navy-50 w-20 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-lemon-500"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="font-semibold text-navy-900">{course.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pl-2">
                        <StatusPill
                          label={course.pendingGrading > 0 ? `${course.pendingGrading} to grade` : 'Up to date'}
                          tone={course.pendingGrading > 0 ? 'warning' : 'success'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Recent Submissions" onViewAll={() => navigate('/instructor/assignments')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider">
                    <th className="py-2 pr-2 font-semibold">Assignment</th>
                    <th className="py-2 px-2 font-semibold">Course</th>
                    <th className="py-2 px-2 font-semibold">Submitted</th>
                    <th className="py-2 pl-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignments.map((item) => (
                    <tr key={item.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2 font-semibold text-navy-900">{item.title}</td>
                      <td className="py-2.5 px-2 text-navy-700">{item.course}</td>
                      <td className="py-2.5 px-2 text-secondary-text">
                        {item.submittedCount}/{item.enrolled}
                      </td>
                      <td className="py-2.5 pl-2">
                        <StatusPill label={item.status} tone={assignmentStatusTone(item.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSummaryCard>
        </div>

        <div className="space-y-4">
          <DashboardSummaryCard title="Announcements" onViewAll={() => navigate('/instructor/announcements')}>
            <div className="space-y-2">
              {data.announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{announcement.title}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">
                        {announcement.views} views · {announcement.postedAt}
                      </p>
                    </div>
                    <StatusPill
                      label={announcement.priority === 'important' ? 'Important' : 'Update'}
                      tone={announcement.priority === 'important' ? 'warning' : 'neutral'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Upcoming Live Sessions" onViewAll={() => navigate('/instructor/live-classes')}>
            <div className="space-y-2">
              {data.liveClasses
                .filter((s) => s.status !== 'ended')
                .map((item) => (
                  <div key={item.id} className="rounded-lg border border-divider p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F3FF] flex items-center justify-center shrink-0">
                        <ZoomIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-navy-900 truncate">{item.title}</p>
                        <p className="text-[10.5px] text-secondary-text mt-0.5">{item.course}</p>
                        <p className="text-[10.5px] text-navy-700 mt-0.5">
                          {item.startAt} · {item.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Help Desk" onViewAll={() => navigate('/instructor/help-desk')}>
            <div className="space-y-2">
              {data.helpDeskTickets.slice(0, 2).map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-divider p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-warning-bg text-[#B45309] flex items-center justify-center shrink-0">
                      <Headset size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-navy-900 truncate">{ticket.subject}</p>
                      <p className="text-[10.5px] text-secondary-text mt-0.5">
                        {ticket.category} · {ticket.updatedAt}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <StatusPill
                          label={ticket.priority}
                          tone={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'info'}
                        />
                        <StatusPill
                          label={ticket.status}
                          tone={ticket.status === 'open' ? 'warning' : ticket.status === 'in-review' ? 'info' : 'success'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Recent Activity">
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 rounded-lg border border-divider p-2.5">
                  <Megaphone size={13} className="text-info mt-0.5 shrink-0" />
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

      <GlassCard className="p-3 bg-lemon-50/50 border-lemon-500/20">
        <div className="flex items-center gap-2 text-[12px] text-navy-700">
          <CheckCircle2 size={14} className="text-lemon-700" />
          Your dashboard reflects your teaching data for {data.term}. Grades and attendance update as you post results.
        </div>
      </GlassCard>
    </div>
  )
}

export default InstructorDashboardPage
