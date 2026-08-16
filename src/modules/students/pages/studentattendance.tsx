import { useMemo } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Clock, UserRoundCheck, XCircle } from 'lucide-react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { AttendanceRecord } from '../types'

const statusTone: Record<AttendanceRecord['status'], 'success' | 'danger' | 'warning' | 'info'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'info',
}

const statusLabel: Record<AttendanceRecord['status'], string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
}

const statusIcon: Record<AttendanceRecord['status'], typeof CheckCircle2> = {
  present: CheckCircle2,
  absent: XCircle,
  late: Clock,
  excused: AlertCircle,
}

const statusAccent: Record<AttendanceRecord['status'], string> = {
  present: 'border-l-success from-success-bg/50',
  absent: 'border-l-danger from-danger-bg/40',
  late: 'border-l-warning from-warning-bg/50',
  excused: 'border-l-info from-info-bg/50',
}

function AttendanceRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (rate / 100) * circumference
  const color = rate >= 90 ? '#16A34A' : rate >= 75 ? '#1976D2' : '#EAB308'

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#EEF1F8" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[16px] font-extrabold text-navy-900 leading-none">{rate}%</span>
        <span className="text-[8px] font-semibold uppercase text-secondary-text mt-0.5">Rate</span>
      </div>
    </div>
  )
}

export function StudentAttendancePage() {
  const { data, isLoading, isError } = useStudentDashboard()

  const stats = useMemo(() => {
    if (!data) return { overallRate: 0, totalAttended: 0, totalSessions: 0, presentCount: 0 }
    const totalAttended = data.attendance.reduce((sum, r) => sum + r.sessionsAttended, 0)
    const totalSessions = data.attendance.reduce((sum, r) => sum + r.sessionsTotal, 0)
    const overallRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0
    const presentCount = data.attendance.filter((r) => r.status === 'present').length
    return { overallRate, totalAttended, totalSessions, presentCount }
  }, [data])

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load attendance." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Attendance"
        subtitle="Session participation across your enrolled courses this term."
      />

      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <AttendanceRing rate={stats.overallRate} />
          <div className="flex-1 text-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">Overall attendance</div>
            <h2 className="mt-2 text-[28px] md:text-[32px] font-bold leading-none">
              {stats.overallRate}%
            </h2>
            <p className="mt-2 text-[13px] text-navy-200">
              {stats.totalAttended} of {stats.totalSessions} sessions attended · {data.term}
            </p>
            <p className="mt-1 text-[12px] text-navy-300">
              {stats.overallRate >= 90
                ? 'Excellent consistency — keep it up!'
                : stats.overallRate >= 75
                  ? 'Good standing — a few more sessions will boost your rate.'
                  : 'Try to attend upcoming sessions to improve your rate.'}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Sessions attended"
          value={stats.totalAttended}
          sub={`of ${stats.totalSessions} total`}
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Courses tracked"
          value={data.attendance.length}
          sub="Active enrollments"
          icon={<CalendarDays size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Present status"
          value={stats.presentCount}
          sub="Courses marked present"
          icon={<UserRoundCheck size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.attendance.map((record) => {
          const rate = Math.round((record.sessionsAttended / record.sessionsTotal) * 100)
          const Icon = statusIcon[record.status]
          const accent = statusAccent[record.status]

          return (
            <GlassCard
              key={record.id}
              className={`p-0 overflow-hidden border-l-4 bg-gradient-to-r ${accent} to-white hover:shadow-md transition-shadow`}
            >
              <div className="p-5 flex gap-4">
                <Monogram label={record.course} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={statusLabel[record.status]} tone={statusTone[record.status]} />
                    <span className="inline-flex items-center gap-1 text-[11px] text-secondary-text">
                      <Icon size={12} />
                      Last session
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug line-clamp-2">
                    {record.course}
                  </h3>
                  <p className="mt-1 text-[12px] text-secondary-text">{record.date}</p>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[22px] font-bold text-navy-900 leading-none">
                        {record.sessionsAttended}
                        <span className="text-[14px] font-semibold text-secondary-text">
                          /{record.sessionsTotal}
                        </span>
                      </div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text mt-1">
                        Sessions attended
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-bold text-navy-900">{rate}%</div>
                      <div className="text-[10.5px] text-secondary-text">Course rate</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 border border-divider">
                    <div
                      className={`h-full rounded-full ${
                        rate >= 90
                          ? 'bg-gradient-to-r from-success to-emerald-600'
                          : rate >= 75
                            ? 'bg-gradient-to-r from-lemon-500 to-lemon-700'
                            : 'bg-gradient-to-r from-warning to-amber-600'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {data.attendance.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <UserRoundCheck size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No attendance records yet</p>
          <p className="text-[12.5px] text-secondary-text mt-1">Records appear after your first live sessions.</p>
        </GlassCard>
      ) : null}
    </div>
  )
}

export default StudentAttendancePage
