import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserRoundCheck,
  XCircle,
} from 'lucide-react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { StudentPageError, StudentPageLoading } from '../components/StudentPageStates'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { useAttendance } from '../../institution/hooks/useAttendance'
import { getSessionPerson } from '../../../shared/storage/session'
import type { AttendanceRecord, AttendanceStatus } from '../../institution/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Present', 'Absent', 'Late', 'Excused']

const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string
    tone: 'success' | 'danger' | 'warning' | 'info'
    icon: typeof CheckCircle2
    accent: string
    dot: string
  }
> = {
  present: {
    label: 'Present',
    tone: 'success',
    icon: CheckCircle2,
    accent: 'border-l-success from-success-bg/50',
    dot: 'bg-success',
  },
  absent: {
    label: 'Absent',
    tone: 'danger',
    icon: XCircle,
    accent: 'border-l-danger from-danger-bg/40',
    dot: 'bg-danger',
  },
  late: {
    label: 'Late',
    tone: 'warning',
    icon: Clock,
    accent: 'border-l-warning from-warning-bg/50',
    dot: 'bg-warning',
  },
  excused: {
    label: 'Excused',
    tone: 'info',
    icon: AlertCircle,
    accent: 'border-l-info from-info-bg/50',
    dot: 'bg-info',
  },
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── SVG attendance ring ───────────────────────────────────────────────────────

function AttendanceRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (rate / 100) * circumference
  const color = rate >= 90 ? '#16A34A' : rate >= 75 ? '#1976D2' : '#FFC107'

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

// ─── Thin progress bar ────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-gradient-to-r from-success to-emerald-600'
    : value >= 60 ? 'bg-gradient-to-r from-lemon-500 to-lemon-700'
    : 'bg-gradient-to-r from-warning to-amber-600'
  return (
    <div className="h-2 rounded-full bg-white/80 border border-divider overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

interface CalendarViewProps {
  sessions: Array<{ date: string; status: AttendanceStatus }>
}

function CalendarView({ sessions }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const sessionMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {}
    for (const s of sessions) {
      map[s.date] = s.status
    }
    return map
  }, [sessions])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ day: number | null; iso: string | null }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, iso: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso })
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  return (
    <GlassCard className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold text-navy-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg hover:bg-navy-50 flex items-center justify-center text-secondary-text hover:text-navy-900 transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg hover:bg-navy-50 flex items-center justify-center text-secondary-text hover:text-navy-900 transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-secondary-text py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell.day || !cell.iso) {
            return <div key={`empty-${i}`} />
          }
          const status = sessionMap[cell.iso]
          const isToday = cell.iso === today.toISOString().slice(0, 10)
          const cfg = status ? STATUS_CONFIG[status] : null

          return (
            <div
              key={cell.iso}
              title={status ? `${formatDate(cell.iso)} — ${STATUS_CONFIG[status].label}` : formatDate(cell.iso)}
              className={`relative flex flex-col items-center justify-center h-9 rounded-lg text-[12px] font-semibold transition-colors
                ${isToday ? 'ring-2 ring-lemon-500 ring-offset-1' : ''}
                ${cfg
                  ? status === 'present'
                    ? 'bg-success-bg text-success'
                    : status === 'absent'
                      ? 'bg-danger-bg text-danger'
                      : status === 'late'
                        ? 'bg-warning-bg text-[#8A6D00]'
                        : 'bg-info-bg text-info'
                  : 'text-navy-500'
                }`}
            >
              {cell.day}
              {cfg && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${cfg.dot}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-divider">
        {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG.present][]).map(
          ([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5 text-[11px] text-secondary-text">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          ),
        )}
      </div>
    </GlassCard>
  )
}

// ─── Course attendance card ───────────────────────────────────────────────────

interface CourseCardProps {
  record: AttendanceRecord
  selected: boolean
  onClick: () => void
}

function CourseCard({ record, selected, onClick }: CourseCardProps) {
  const latestStatus = record.history[record.history.length - 1]?.status
  const cfg = latestStatus ? STATUS_CONFIG[latestStatus] : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-0 overflow-hidden rounded-xl border-l-4 bg-gradient-to-r to-white transition-all cursor-pointer
        ${cfg ? `${cfg.accent}` : 'border-l-navy-200 from-navy-50/50'}
        ${selected ? 'ring-2 ring-lemon-500 ring-offset-1 shadow-md' : 'hover:shadow-md border border-divider'}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <AttendanceRing rate={record.attendancePercent} />
          <div className="min-w-0 flex-1">
            {cfg && <StatusPill label={cfg.label} tone={cfg.tone} />}
            <h3 className="mt-1.5 text-[14px] font-bold text-navy-900 leading-snug">
              {record.courseCode}
            </h3>
            <p className="mt-0.5 text-[12px] text-secondary-text truncate">{record.courseTitle}</p>
            <p className="mt-0.5 text-[11px] text-secondary-text">{record.instructorName}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Present', value: record.present, color: 'text-success' },
                { label: 'Absent', value: record.absent, color: 'text-danger' },
                { label: 'Late', value: record.late, color: 'text-[#8A6D00]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg bg-white/70 border border-divider py-1.5 px-1">
                  <div className={`text-[16px] font-bold leading-none ${color}`}>{value}</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-secondary-text mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <ProgressBar value={record.attendancePercent} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── History table ────────────────────────────────────────────────────────────

interface HistoryTableProps {
  record: AttendanceRecord
  activeTab: string
}

function HistoryTable({ record, activeTab }: HistoryTableProps) {
  const sorted = useMemo(() => {
    const all = [...record.history].sort((a, b) => b.date.localeCompare(a.date))
    if (activeTab === 'All') return all
    const map: Record<string, AttendanceStatus> = {
      Present: 'present', Absent: 'absent', Late: 'late', Excused: 'excused',
    }
    const target = map[activeTab]
    return target ? all.filter((h) => h.status === target) : all
  }, [record.history, activeTab])

  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center">
        <CalendarDays size={28} className="mx-auto text-navy-300 mb-2" />
        <p className="text-[13px] font-semibold text-navy-900">No sessions match this filter</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px] text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider bg-navy-50/40">
            <th className="py-3 pl-5 pr-3 font-semibold">Date</th>
            <th className="py-3 px-3 font-semibold">Course</th>
            <th className="py-3 px-3 font-semibold">Status</th>
            <th className="py-3 pl-3 pr-5 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((session, i) => {
            const cfg = STATUS_CONFIG[session.status]
            const Icon = cfg.icon
            return (
              <tr
                key={i}
                className="border-b border-divider last:border-0 hover:bg-navy-50/30 text-[12px] transition-colors"
              >
                <td className="py-3 pl-5 pr-3 text-navy-700 font-medium whitespace-nowrap">
                  {formatDate(session.date)}
                </td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-navy-900">{record.courseCode}</p>
                  <p className="text-[10.5px] text-secondary-text">{record.courseTitle}</p>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon size={13} className={cfg.tone === 'success' ? 'text-success'
                      : cfg.tone === 'danger' ? 'text-danger'
                      : cfg.tone === 'warning' ? 'text-warning'
                      : 'text-info'} />
                    <StatusPill label={cfg.label} tone={cfg.tone} />
                  </span>
                </td>
                <td className="py-3 pl-3 pr-5 text-secondary-text">{session.note ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StudentAttendancePage() {
  const { data, isLoading, isError } = useStudentDashboard()
  const { records } = useAttendance()
  const person = getSessionPerson()

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('All')

  // Records scoped to this student only — read-only, never mutated
  const myRecords = useMemo(() => {
    if (!person) return []
    return records.filter(
      (r) => r.studentId === person.id || r.studentName === person.name,
    )
  }, [records, person])

  const effectiveCourseId = selectedCourseId || myRecords[0]?.courseId || ''
  const selectedRecord = myRecords.find((r) => r.courseId === effectiveCourseId) ?? null

  // Overall stats across all of this student's records
  const stats = useMemo(() => {
    if (myRecords.length === 0) return { overallRate: 0, present: 0, absent: 0, late: 0, excused: 0 }
    const overallRate = Math.round(
      myRecords.reduce((sum, r) => sum + r.attendancePercent, 0) / myRecords.length,
    )
    const present = myRecords.reduce((s, r) => s + r.present, 0)
    const absent = myRecords.reduce((s, r) => s + r.absent, 0)
    const late = myRecords.reduce((s, r) => s + r.late, 0)
    const excused = myRecords.reduce((s, r) => s + r.excused, 0)
    return { overallRate, present, absent, late, excused }
  }, [myRecords])

  // All sessions across all courses — used for calendar
  const allSessions = useMemo(
    () => myRecords.flatMap((r) => r.history),
    [myRecords],
  )

  // Sessions for the selected course — calendar shows these when a course is picked
  const selectedSessions = useMemo(
    () => selectedRecord?.history ?? allSessions,
    [selectedRecord, allSessions],
  )

  if (isLoading) return <StudentPageLoading />
  if (isError || !data) return <StudentPageError message="Failed to load attendance." />

  // Use rich records if available, fall back gracefully to empty state
  const hasRichData = myRecords.length > 0

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* ── Header ── */}
      <PageHeader
        title="My Attendance"
        subtitle="View your attendance across your courses."
      />

      {/* ── Overview banner ── */}
      <GlassCard className="relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="absolute right-0 top-0 w-52 h-52 rounded-full bg-lemon-500/10 blur-3xl" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <AttendanceRing rate={stats.overallRate} />
          <div className="flex-1 text-white min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">
              Overall attendance
            </div>
            <h2 className="mt-2 text-[28px] md:text-[32px] font-bold leading-none">
              {stats.overallRate}%
            </h2>
            <p className="mt-2 text-[13px] text-navy-200">
              {stats.present} sessions present · {myRecords.length} course{myRecords.length === 1 ? '' : 's'} · {data.term}
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

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatBlock
          label="Overall attendance"
          value={`${stats.overallRate}%`}
          sub="Across all courses"
          icon={<UserRoundCheck size={17} />}
          iconBg="bg-lemon-50 text-lemon-900"
        />
        <StatBlock
          label="Present"
          value={stats.present}
          sub="Sessions attended"
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Absent"
          value={stats.absent}
          sub="Sessions missed"
          icon={<XCircle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Late"
          value={stats.late}
          sub="Arrived late"
          icon={<Clock size={17} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
        <StatBlock
          label="Excused"
          value={stats.excused}
          sub="With valid reason"
          icon={<AlertCircle size={17} />}
          iconBg="bg-info-bg text-info"
        />
      </div>

      {hasRichData ? (
        <>
          {/* ── Course attendance cards ── */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold text-navy-900">Course Attendance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {myRecords.map((record) => (
                <CourseCard
                  key={record.id}
                  record={record}
                  selected={effectiveCourseId === record.courseId}
                  onClick={() => {
                    setSelectedCourseId(record.courseId)
                    setActiveTab('All')
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── History + Calendar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* History table */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold text-navy-900">Attendance History</h2>
                  {selectedRecord && (
                    <p className="text-[12px] text-secondary-text mt-0.5">
                      {selectedRecord.courseCode} — {selectedRecord.courseTitle}
                    </p>
                  )}
                </div>
                <span className="text-[12px] text-secondary-text shrink-0">
                  {selectedRecord
                    ? `${selectedRecord.totalSessions} session${selectedRecord.totalSessions === 1 ? '' : 's'}`
                    : ''}
                </span>
              </div>

              {/* Filter tabs */}
              <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />

              <GlassCard className="overflow-hidden p-0">
                {selectedRecord ? (
                  <HistoryTable record={selectedRecord} activeTab={activeTab} />
                ) : (
                  <div className="py-10 text-center">
                    <CalendarDays size={28} className="mx-auto text-navy-300 mb-2" />
                    <p className="text-[13px] font-semibold text-navy-900">Select a course above</p>
                    <p className="text-[12px] text-secondary-text mt-1">
                      Click a course card to view its attendance history.
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Calendar */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[15px] font-bold text-navy-900">
                {selectedRecord ? `${selectedRecord.courseCode} Calendar` : 'Attendance Calendar'}
              </h2>
              <CalendarView sessions={selectedSessions} />
            </div>
          </div>
        </>
      ) : (
        /* ── Fallback: use legacy dashboard data if no rich records ── */
        <GlassCard className="p-10 text-center">
          <UserRoundCheck size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No attendance records yet</p>
          <p className="text-[12.5px] text-secondary-text mt-1 max-w-xs mx-auto leading-relaxed">
            Your attendance records will appear here after your first live sessions are tracked by
            your instructor.
          </p>
        </GlassCard>
      )}

      {/* ── Read-only note ── */}
      {hasRichData && (
        <GlassCard className="p-4 flex items-start gap-3 border-info/20 bg-info-bg/40">
          <UserRoundCheck size={16} className="text-info shrink-0 mt-0.5" />
          <p className="text-[12px] text-info leading-relaxed">
            <span className="font-semibold">View only: </span>
            Attendance is recorded by your instructor. If you believe a record is incorrect, contact
            your instructor or raise a help desk ticket.
          </p>
        </GlassCard>
      )}
    </div>
  )
}

export default StudentAttendancePage
