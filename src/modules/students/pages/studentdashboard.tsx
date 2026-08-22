import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CalendarDays,
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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { DashboardSummaryCard } from '../../../shared/components/DashboardSummaryCard'
import { AnnouncementDashboardList } from '../../../shared/components/announcements/AnnouncementFeedCard'
import { StatusPill } from '../../../shared/components/StatusPill'
import { StatBlock } from '../../../shared/components/StatBlock'
import { ZoomIcon } from '../../../shared/components/ZoomIcon'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { TrendLineChart } from '../../institution/components/TrendLineChart'
import { StudentPageLoading } from '../components/StudentPageStates'
import { StudentProfileCard } from '../components/StudentProfileCard'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { AssignmentItem, UpcomingDeadline } from '../types'

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

function deadlineTone(status: UpcomingDeadline['status']) {
  if (status === 'overdue') return 'danger'
  if (status === 'today') return 'warning'
  return 'info'
}

function assignmentStatusTone(status: AssignmentItem['status']) {
  if (status === 'Ready to submit') return 'warning'
  if (status === 'Submitted') return 'info'
  return 'success'
}

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, reload } = useStudentDashboard()

  if (isLoading) return <StudentPageLoading />

  if (isError || !data) {
    return (
      <GlassCard className="p-5 border-danger/30 bg-danger-bg text-danger">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">Failed to load the student dashboard</h2>
            <p className="mt-1 text-[13px] leading-6 text-danger/80">
              {error?.message ?? 'Please try again to load your learning workspace.'}
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

  const gpaTrend = getTrendFromSeries(data.kpiTrends.gpa)
  const quizTrend = getTrendFromSeries(data.kpiTrends.quizScores)
  const progressTrend = getTrendFromSeries(data.kpiTrends.courseProgress)
  const attendanceTrend = getTrendFromSeries(data.kpiTrends.attendanceRate)
  const assignmentsTrend = getTrendFromSeries(data.kpiTrends.assignmentsCompleted)
  const studyHoursTrend = getTrendFromSeries(data.kpiTrends.studyHours)
  const sessionsTrend = getTrendFromSeries([2, 2, 3, 2, 4, data.kpis.upcomingSessions])

  const courseProgressTrend = data.kpiTrends.courseProgress.map((value, index) => ({
    label: data.gradeTrend[index]?.label ?? `${index + 1}`,
    value,
  }))

  const overdueCount = data.upcomingDeadlines.filter((d) => d.status === 'overdue').length
  const firstName = data.studentName.split(' ')[0]

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {overdueCount > 0 ? (
        <GlassCard className="p-4 border-danger/30 bg-danger-bg/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-navy-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger" />
                {overdueCount} overdue item{overdueCount === 1 ? '' : 's'} need attention
              </p>
              <p className="text-[12px] text-secondary-text mt-1">
                Review your assignments and quizzes to stay on track for {data.term}.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/student/assignments')}>
              View assignments
            </Button>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4 md:gap-5 items-start">
        <StudentProfileCard data={data} />

        <div className="flex flex-col gap-4 md:gap-5 min-w-0">
          <div>
            <h1 className="text-[22px] font-bold text-navy-900">
              Welcome back, <span className="text-navy-700">{firstName}</span>
            </h1>
            <p className="text-[13px] text-secondary-text mt-1">
              Track your learning progress, upcoming deadlines, and performance across {data.program} · {data.term}.
            </p>
            <p className="text-[12px] text-lemon-700 font-semibold mt-1.5">{data.standing}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button variant="outline-green" onClick={() => navigate('/student/quizzes')}>
                <ClipboardList size={15} />
                Start quiz
              </Button>
              <Button variant="outline-blue" onClick={() => navigate('/student/assignments')}>
                <SquarePen size={15} />
                Submit assignment
              </Button>
              <Button variant="outline-purple" onClick={() => navigate('/student/live-classes')}>
                <MonitorPlay size={15} />
                Join live class
              </Button>
              <Button variant="secondary" onClick={() => navigate('/student/calendar')}>
                <CalendarClock size={15} />
                View calendar
              </Button>
              <Button variant="secondary" onClick={() => navigate('/student/resources')}>
                <BookOpen size={15} />
                Browse resources
              </Button>
              <Button variant="primary" onClick={() => navigate('/student/grades')}>
                <GraduationCap size={15} />
                View grades
              </Button>
            </div>
          </div>

          <DashboardSummaryCard title="Upcoming Deadlines" onViewAll={() => navigate('/student/calendar')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.upcomingDeadlines.map((item) => (
                <div key={item.id} className="rounded-lg border border-divider p-2.5 nested-panel">
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Active Courses"
          value={data.kpis.activeCourses}
          sub="Enrolled this term"
          trend={progressTrend.trend}
          trendValue={progressTrend.trendValue}
          sparkline={data.kpiTrends.courseProgress}
          sparklineColor="#7C3AED"
          icon={<BookOpen size={STAT} />}
          iconBg="bg-navy-50 text-navy-700"
        />
        <StatBlock
          label="Current GPA"
          value={data.kpis.gpa.toFixed(2)}
          sub="Based on graded credits"
          trend={gpaTrend.trend}
          trendValue={gpaTrend.trendValue}
          sparkline={data.kpiTrends.gpa.map((v) => Math.round(v * 100))}
          sparklineColor="#A8D400"
          icon={<GraduationCap size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
        <StatBlock
          label="Avg. Quiz Score"
          value={`${data.kpis.avgQuizScore}%`}
          sub="Last 3 assessments"
          trend={quizTrend.trend}
          trendValue={quizTrend.trendValue}
          sparkline={data.kpiTrends.quizScores}
          sparklineColor="#1976D2"
          icon={<CheckCircle2 size={STAT} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Attendance Rate"
          value={`${data.kpis.attendanceRate}%`}
          sub="Across all courses"
          trend={attendanceTrend.trend}
          trendValue={attendanceTrend.trendValue}
          sparkline={data.kpiTrends.attendanceRate}
          sparklineColor="#16A34A"
          icon={<UserRoundCheck size={STAT} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Due This Week"
          value={data.kpis.dueThisWeek}
          sub="Assignments & quizzes"
          sparkline={[6, 5, 5, 4, 5, data.kpis.dueThisWeek]}
          sparklineColor="#E53935"
          icon={<CalendarDays size={STAT} />}
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
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Assignments Done"
          value={data.kpis.assignmentsCompleted}
          sub="Submitted this term"
          trend={assignmentsTrend.trend}
          trendValue={assignmentsTrend.trendValue}
          sparkline={data.kpiTrends.assignmentsCompleted}
          sparklineColor="#2A3560"
          icon={<SquarePen size={STAT} />}
          iconBg="bg-navy-50 text-navy-700"
        />
        <StatBlock
          label="Study Hours"
          value={data.kpis.studyHoursWeekly}
          sub="This week"
          trend={studyHoursTrend.trend}
          trendValue={studyHoursTrend.trendValue}
          sparkline={data.kpiTrends.studyHours}
          sparklineColor="#A8D400"
          icon={<TrendingUp size={STAT} />}
          iconBg="bg-lemon-50 text-lemon-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <GlassCard className="p-5 flex flex-col h-full w-full">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-navy-900">Learning Progress Overview</h3>
            <p className="text-[11.5px] text-secondary-text mt-1">
              Breakdown of your assignments and assessments this term
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
            <div
              className="w-36 h-36 shrink-0 rounded-full grid place-items-center"
              style={{ background: `conic-gradient(${progressStops})` }}
            >
              <div className="w-24 h-24 rounded-full soft-surface grid place-items-center text-center">
                <div>
                  <div className="text-[22px] font-extrabold text-navy-900">{completedPercent}%</div>
                  <div className="text-[9px] text-secondary-text font-semibold uppercase tracking-wide">
                    Completed
                  </div>
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
                  <span className="text-navy-900 font-bold">{item.count}</span>
                </div>
              ))}
              <div className="pt-2 text-[11px] text-secondary-text">
                Total tracked items: {totalProgress}
              </div>
            </div>
          </div>
        </GlassCard>

        <TrendLineChart
          title="Grade Performance Trend"
          subtitle="Average course grade over the last 6 months"
          data={data.gradeTrend}
          color="#A8D400"
          unit="%"
        />

        <TrendLineChart
          title="Quiz Score Trend"
          subtitle="Average quiz performance over the last 6 months"
          data={data.quizScoreTrend}
          color="#1976D2"
          unit="%"
        />

        <TrendLineChart
          title="Course Progress Trend"
          subtitle="Overall completion across enrolled modules"
          data={courseProgressTrend}
          color="#7C3AED"
          unit="%"
        />

        <TrendLineChart
          title="Attendance Trend"
          subtitle="Session attendance rate over the last 6 months"
          data={data.attendanceTrend}
          color="#16A34A"
          unit="%"
        />

        <TrendLineChart
          title="Weekly Study Hours"
          subtitle="Time spent learning over the last 6 weeks"
          data={data.studyHoursTrend}
          color="#2A3560"
          unit="h"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DashboardSummaryCard title="My Courses" onViewAll={() => navigate('/student/courses')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="table-header-label border-b border-divider table-header-bar">
                    <th className="py-2 pr-2 font-semibold">Course</th>
                    <th className="py-2 px-2 font-semibold">Instructor</th>
                    <th className="py-2 px-2 font-semibold">Next Session</th>
                    <th className="py-2 px-2 font-semibold">Progress</th>
                    <th className="py-2 pl-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.filter((c) => c.status === 'active').map((course) => (
                    <tr key={course.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-navy-900">{course.title}</div>
                        <div className="text-[10.5px] text-secondary-text mt-0.5">{course.code}</div>
                      </td>
                      <td className="py-2.5 px-2 text-navy-700">{course.instructor}</td>
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
                        <StatusPill label="Active" tone="success" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Recent Assignments" onViewAll={() => navigate('/student/assignments')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="table-header-label border-b border-divider table-header-bar">
                    <th className="py-2 pr-2 font-semibold">Assignment</th>
                    <th className="py-2 px-2 font-semibold">Course</th>
                    <th className="py-2 px-2 font-semibold">Due</th>
                    <th className="py-2 pl-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignments.map((item) => (
                    <tr key={item.id} className="border-b border-divider last:border-0 text-[12px]">
                      <td className="py-2.5 pr-2 font-semibold text-navy-900">{item.title}</td>
                      <td className="py-2.5 px-2 text-navy-700">{item.course}</td>
                      <td className="py-2.5 px-2 text-secondary-text">{item.dueAt}</td>
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
          <DashboardSummaryCard title="Announcements" onViewAll={() => navigate('/student/announcements')}>
            <AnnouncementDashboardList
              items={data.announcements.slice(0, 3)}
              showAuthor
              emptyMessage="No announcements yet — check back soon."
            />
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Upcoming Live Sessions" onViewAll={() => navigate('/student/live-classes')}>
            <div className="space-y-2">
              {data.liveClasses
                .filter((s) => s.status !== 'ended')
                .map((item) => (
                  <div key={item.id} className="rounded-lg border border-divider p-2.5 nested-panel">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-info-bg flex items-center justify-center shrink-0">
                        <ZoomIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-navy-900 truncate">{item.title}</p>
                        <p className="text-[10.5px] text-secondary-text mt-0.5">
                          {item.course} · {item.instructor}
                        </p>
                        <p className="text-[10.5px] text-navy-700 mt-0.5">
                          {item.startAt} · {item.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DashboardSummaryCard>

          <DashboardSummaryCard title="Help Desk" onViewAll={() => navigate('/student/help-desk')}>
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

      <GlassCard className="p-3 nested-panel border-lemon-500/20">
        <div className="flex items-center gap-2 text-[12px] text-navy-700">
          <CheckCircle2 size={14} className="text-lemon-700" />
          Your dashboard reflects your personal learning data for {data.term}. Grades and attendance update as instructors post results.
        </div>
      </GlassCard>
    </div>
  )
}

export default StudentDashboardPage
