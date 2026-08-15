import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Plus,
  Presentation,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInstitutionOverview } from '../hooks/useInstitution'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import { StatBlock } from '../../../shared/components/StatBlock'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { MiniBarChart } from '../components/MiniBarChart'
import type { AttentionItem, CoursePerformanceItem, DeadlineItem } from '../types'

const STAT = 17

function AttentionList({
  title,
  items,
}: {
  title: string
  items: AttentionItem[]
}) {
  const toneBySeverity = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  } as const

  return (
    <GlassCard className="p-5">
      <h3 className="text-[14px] font-extrabold text-navy-900 mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-divider/80 bg-white/70 p-3.5">
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

export function InstitutionOverviewPage() {
  const navigate = useNavigate()
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

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Institution Dashboard"
        subtitle="Track institutional performance, learner progress and operational priorities for your campus."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/admin/courses')}>
              <Plus size={15} />
              Create Course
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/people')}>
              <UserPlus size={15} />
              Add Student
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/people')}>
              <Presentation size={15} />
              Add Instructor
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/reports')}>
              <CalendarClock size={15} />
              Schedule Class
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/reports')}>
              <Megaphone size={15} />
              Create Announcement
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/reports')}>
              <FileText size={15} />
              Generate Report
            </Button>
          </>
        }
      />

      <GlassCard className="p-5 bg-gradient-to-r from-navy-900 to-[#253861] text-white border-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-navy-200/90 font-semibold">
              Institution Scope
            </p>
            <h2 className="text-[20px] md:text-[24px] font-extrabold mt-1">{data.institutionName}</h2>
            <p className="text-[12.5px] text-navy-200 mt-1">{data.institutionSubtitle}</p>
          </div>
          <StatusPill label="Institution Admin View" tone="info" />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 md:gap-5">
        <StatBlock
          label="Total Students"
          value={data.kpis.totalStudents.toLocaleString()}
          icon={<Users size={STAT} />}
          iconBg="bg-gradient-to-br from-navy-50 to-[#DCE9FF] text-navy-900 ring-1 ring-[#9FC2FF]/50"
        />
        <StatBlock
          label="Active Students"
          value={data.kpis.activeStudents.toLocaleString()}
          sub="Learners active in the last 7 days"
          icon={<TrendingUp size={STAT} />}
          iconBg="bg-gradient-to-br from-[#E7F1FF] to-[#CFE3FF] text-[#0B4CA6] ring-1 ring-[#9FC2FF]/60"
        />
        <StatBlock
          label="Active Courses"
          value={data.kpis.activeCourses}
          icon={<BookOpen size={STAT} />}
          iconBg="bg-gradient-to-br from-[#ECF4FF] to-[#D5E8FF] text-[#124C95] ring-1 ring-[#A4C8FF]/60"
        />
        <StatBlock
          label="Instructors"
          value={data.kpis.instructors}
          icon={<GraduationCap size={STAT} />}
          iconBg="bg-gradient-to-br from-[#EDF2FF] to-[#D8E2FF] text-[#2A3C8E] ring-1 ring-[#B4C1FF]/60"
        />
        <StatBlock
          label="Completion Rate"
          value={`${data.kpis.completionRate}%`}
          sub="Average course completion"
          icon={<CheckCircle2 size={STAT} />}
          trend="up"
          iconBg="bg-gradient-to-br from-[#EAF9E2] to-[#D6EDC7] text-[#436A00] ring-1 ring-lemon-500/30"
        />
        <StatBlock
          label="Pending Approvals"
          value={data.kpis.pendingApprovals}
          sub="Enrollments and requests"
          icon={<ClipboardCheck size={STAT} />}
          iconBg="bg-gradient-to-br from-[#FFF6DD] to-[#FFE8AE] text-[#7D5B00] ring-1 ring-warning/40"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-stretch">
        <MiniBarChart
          title="Student Enrollment Trend"
          subtitle="Total enrolled learners over the last 6 months"
          data={enrollmentBars}
        />

        <MiniBarChart
          title="Active Student Trend"
          subtitle="Weekly active learners over the last 6 months"
          data={activeBars}
        />

        <GlassCard className="p-6">
          <div className="mb-4">
            <h3 className="text-[15px] font-extrabold text-navy-900">Student Progress Overview</h3>
            <p className="text-[11.5px] text-secondary-text mt-1.5">Progress distribution across enrolled learners</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="w-36 h-36 rounded-full grid place-items-center"
              style={{
                background: `conic-gradient(${progressStops})`,
              }}
            >
              <div className="w-24 h-24 rounded-full bg-white grid place-items-center text-center">
                <div>
                  <div className="text-[22px] font-extrabold text-navy-900">{completedPercent}%</div>
                  <div className="text-[10px] text-secondary-text font-semibold uppercase tracking-wide">Completed</div>
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
      </div>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-extrabold text-navy-900">Course Performance</h3>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/courses')}>
            View Courses
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wider text-secondary-text">
                <th className="py-2.5 px-2">Course</th>
                <th className="py-2.5 px-2">Instructor</th>
                <th className="py-2.5 px-2">Enrolled</th>
                <th className="py-2.5 px-2">Completion</th>
                <th className="py-2.5 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.coursePerformance.map((course) => (
                <tr key={course.id} className="border-t border-divider/80 text-[12.5px]">
                  <td className="py-3 px-2">
                    <div className="font-semibold text-navy-900">{course.title}</div>
                    <div className="text-[11px] text-secondary-text mt-0.5">{course.courseCode}</div>
                  </td>
                  <td className="py-3 px-2 text-navy-700">{course.instructor}</td>
                  <td className="py-3 px-2 text-navy-900 font-semibold">{course.enrolled}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 rounded-full bg-navy-50 w-28 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3C7EFF] to-[#78A7FF]"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-navy-900">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StatusPill
                      label={performanceLabel(course.status)}
                      tone={performanceTone(course.status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <AttentionList title="Pending Enrollments" items={data.pendingEnrollments} />
        <AttentionList title="Learners At Risk" items={data.learnersAtRisk} />
        <AttentionList title="Overdue Assignments & Exams" items={data.overdueAssessments} />
        <AttentionList title="Courses Requiring Attention" items={data.coursesRequiringAttention} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 items-start">
        <GlassCard className="p-5">
          <h3 className="text-[14px] font-extrabold text-navy-900 mb-3">Upcoming Live Classes</h3>
          <div className="space-y-3">
            {data.upcomingLiveClasses.map((item) => (
              <div key={item.id} className="rounded-xl border border-divider/80 bg-white/70 p-3.5">
                <p className="text-[12.5px] font-semibold text-navy-900">{item.title}</p>
                <p className="text-[11.5px] text-secondary-text mt-1">
                  {item.course} · {item.instructor}
                </p>
                <p className="text-[11.5px] text-navy-700 mt-1">
                  {item.date} · {item.time}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-[14px] font-extrabold text-navy-900 mb-3">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((item) => (
              <div key={item.id} className="rounded-xl border border-divider/80 bg-white/70 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] font-semibold text-navy-900">{item.title}</p>
                    <p className="text-[11.5px] text-secondary-text mt-1">{item.course}</p>
                  </div>
                  <StatusPill label={item.status} tone={deadlineTone(item.status)} />
                </div>
                <p className="text-[11.5px] text-navy-700 mt-1.5">{item.dueIn}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-[14px] font-extrabold text-navy-900 mb-3">Recent Activity</h3>
          <div className="space-y-2.5">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-divider/80 bg-white/70 p-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-info mt-0.5" />
                  <div>
                    <p className="text-[12.5px] text-navy-900 font-medium">{activity.text}</p>
                    <p className="text-[11px] text-secondary-text mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-[14px] font-extrabold text-navy-900 mb-3">Recent Announcements</h3>
          <div className="space-y-2.5">
            {data.recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-divider/80 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] text-navy-900 font-semibold">{announcement.title}</p>
                    <p className="text-[11px] text-secondary-text mt-1">
                      {announcement.audience} · {announcement.postedAt}
                    </p>
                  </div>
                  <StatusPill
                    label={announcement.priority === 'important' ? 'Important' : 'Normal'}
                    tone={announcement.priority === 'important' ? 'warning' : 'neutral'}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4 bg-info-bg/55 border-info/20">
        <div className="flex items-center gap-2.5 text-[12px] text-navy-700">
          <AlertTriangle size={14} className="text-info" />
          This dashboard is scoped to your institution only. Platform-level and multi-tenant administration data is intentionally excluded.
        </div>
      </GlassCard>
    </div>
  )
}
