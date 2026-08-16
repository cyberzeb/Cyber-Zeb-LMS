import { useMemo } from 'react'
import { CalendarDays, CheckCircle2, ClipboardCheck, UserRoundCheck, Users, XCircle } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { AttendanceSession } from '../types'

const statusTone: Record<AttendanceSession['status'], 'success' | 'info' | 'neutral'> = {
  completed: 'success',
  scheduled: 'info',
  cancelled: 'neutral',
}

const statusLabel: Record<AttendanceSession['status'], string> = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
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

export function InstructorAttendancePage() {
  const { data, isLoading, isError } = useInstructorDashboard()

  const stats = useMemo(() => {
    if (!data) return { overallRate: 0, totalPresent: 0, totalEnrolled: 0, sessions: 0 }
    const completed = data.attendanceSessions.filter((s) => s.status === 'completed')
    const totalPresent = completed.reduce((sum, r) => sum + r.presentCount, 0)
    const totalEnrolled = completed.reduce((sum, r) => sum + r.enrolledCount, 0)
    const overallRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0
    return { overallRate, totalPresent, totalEnrolled, sessions: data.attendanceSessions.length }
  }, [data])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load attendance." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Attendance"
        subtitle="Track session participation and take attendance for your courses."
        actions={
          <Button variant="primary">
            <ClipboardCheck size={15} />
            Take attendance
          </Button>
        }
      />

      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <AttendanceRing rate={stats.overallRate} />
          <div className="flex-1 text-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">Overall attendance</div>
            <h2 className="mt-2 text-[28px] md:text-[32px] font-bold leading-none">{stats.overallRate}%</h2>
            <p className="mt-2 text-[13px] text-navy-200">
              {stats.totalPresent} of {stats.totalEnrolled} students present · {data.term}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Students present"
          value={stats.totalPresent}
          sub={`of ${stats.totalEnrolled} enrolled`}
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Sessions tracked"
          value={stats.sessions}
          sub="Across courses"
          icon={<CalendarDays size={17} />}
          iconBg="bg-info-bg text-info"
        />
        <StatBlock
          label="Courses"
          value={data.courses.length}
          sub="Active this term"
          icon={<UserRoundCheck size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.attendanceSessions.map((session) => {
          const rate =
            session.enrolledCount > 0
              ? Math.round((session.presentCount / session.enrolledCount) * 100)
              : 0

          return (
            <GlassCard
              key={session.id}
              className="p-0 overflow-hidden border-l-4 border-l-lemon-500 hover:shadow-md transition-shadow"
            >
              <div className="p-5 flex gap-4">
                <Monogram label={session.course} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={statusLabel[session.status]} tone={statusTone[session.status]} />
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-bold text-navy-900 leading-snug line-clamp-2">
                    {session.course}
                  </h3>
                  <p className="mt-1 text-[12px] text-secondary-text">{session.date}</p>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="flex gap-4 text-[12px]">
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 size={13} />
                        {session.presentCount} present
                      </span>
                      <span className="inline-flex items-center gap-1 text-danger">
                        <XCircle size={13} />
                        {session.absentCount} absent
                      </span>
                      <span className="inline-flex items-center gap-1 text-navy-700">
                        <Users size={13} />
                        {session.enrolledCount} enrolled
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-bold text-navy-900">{rate}%</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-50">
                    <div
                      className="h-full rounded-full bg-lemon-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {data.attendanceSessions.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <UserRoundCheck size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No attendance sessions yet</p>
        </GlassCard>
      ) : null}
    </div>
  )
}

export default InstructorAttendancePage
