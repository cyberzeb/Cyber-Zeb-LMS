import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  PenLine,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { Modal } from '../../../shared/components/Modal'
import { Monogram } from '../../../shared/components/Monogram'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import { useAttendance } from '../../institution/hooks/useAttendance'
import { getSessionPerson } from '../../../shared/storage/session'
import type { AttendanceRecord, AttendanceStatus } from '../../institution/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Present', 'Absent', 'Late', 'Excused']

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral'; color: string }
> = {
  present: { label: 'Present', tone: 'success', color: 'text-success' },
  absent: { label: 'Absent', tone: 'danger', color: 'text-danger' },
  late: { label: 'Late', tone: 'warning', color: 'text-[#8A6D00]' },
  excused: { label: 'Excused', tone: 'neutral', color: 'text-secondary-text' },
}

const RISK_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  warning: 'warning',
  'at-risk': 'danger',
}

const RISK_LABEL: Record<string, string> = {
  good: 'Good',
  warning: 'Warning',
  'at-risk': 'At risk',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** SVG ring showing attendance percentage */
function AttendanceRing({ rate, onDark }: { rate: number; onDark?: boolean }) {
  const r = 36
  const circumference = 2 * Math.PI * r
  const offset = circumference - (rate / 100) * circumference
  const color = rate >= 80 ? '#16A34A' : rate >= 60 ? '#1976D2' : '#E53935'
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={onDark ? 'rgba(255,255,255,0.15)' : undefined}
          className={onDark ? undefined : 'attendance-ring-track'}
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[16px] font-extrabold leading-none ${onDark ? 'text-white' : 'text-navy-900'}`}>
          {rate}%
        </span>
        <span className={`text-[8px] font-semibold uppercase mt-0.5 ${onDark ? 'text-[#c5cade]' : 'text-secondary-text'}`}>
          Rate
        </span>
      </div>
    </div>
  )
}

/** Thin progress bar */
function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-success' : value >= 60 ? 'bg-info' : 'bg-danger'
  return (
    <div className={`h-1.5 rounded-full bg-navy-100 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

// ─── Take Attendance Modal ─────────────────────────────────────────────────────

interface TakeAttendanceModalProps {
  open: boolean
  onClose: () => void
  records: AttendanceRecord[]
  courseCode: string
  courseTitle: string
  date: string
  onDateChange: (d: string) => void
  onSave: (overrides: Record<string, { status: AttendanceStatus; note: string }>) => void
}

function TakeAttendanceModal({
  open,
  onClose,
  records,
  courseCode,
  courseTitle,
  date,
  onDateChange,
  onSave,
}: TakeAttendanceModalProps) {
  // Build initial state from each student's history for the selected date
  const initialOverrides = useMemo(() => {
    const map: Record<string, { status: AttendanceStatus; note: string }> = {}
    for (const r of records) {
      const session = r.history.find((h) => h.date === date)
      map[r.id] = { status: session?.status ?? 'present', note: session?.note ?? '' }
    }
    return map
  }, [records, date])

  const [overrides, setOverrides] = useState<Record<string, { status: AttendanceStatus; note: string }>>(initialOverrides)

  // Re-sync when date changes
  useMemo(() => {
    setOverrides(initialOverrides)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const markAllPresent = () => {
    setOverrides((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, { ...prev[id]!, status: 'present' }])),
    )
  }

  const setStatus = (id: string, status: AttendanceStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id]!, status } }))
  }

  const setNote = (id: string, note: string) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id]!, note } }))
  }

  const presentCount = Object.values(overrides).filter((o) => o.status === 'present').length
  const absentCount = Object.values(overrides).filter((o) => o.status === 'absent').length
  const lateCount = Object.values(overrides).filter((o) => o.status === 'late').length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Take Attendance"
      description={`${courseCode} — ${courseTitle}`}
      icon={<ClipboardCheck size={18} />}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={markAllPresent}>
            <CheckCircle2 size={13} />
            Mark all present
          </Button>
          <Button variant="primary" size="sm" onClick={() => onSave(overrides)}>
            <ClipboardCheck size={13} />
            Save attendance
          </Button>
        </div>
      }
    >
      {/* Date picker + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <CalendarDays size={15} className="text-secondary-text shrink-0" />
          <label className="text-[12px] font-semibold text-navy-900 shrink-0">Session date</label>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-[12.5px] input-surface rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-lemon-500/40 focus:border-lemon-500/60"
          />
        </div>
        <div className="flex gap-3 text-[12px] font-semibold">
          <span className="text-success">{presentCount} present</span>
          <span className="text-danger">{absentCount} absent</span>
          <span className="text-[#8A6D00]">{lateCount} late</span>
        </div>
      </div>

      {/* Student rows */}
      <div className="flex flex-col gap-2">
        {records.map((r) => {
          const override = overrides[r.id] ?? { status: 'present' as AttendanceStatus, note: '' }
          const cfg = STATUS_CONFIG[override.status]
          return (
            <div
              key={r.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                override.status === 'present'
                  ? 'border-success/20 bg-success-bg/30'
                  : override.status === 'absent'
                    ? 'border-danger/20 bg-danger-bg/20'
                    : override.status === 'late'
                      ? 'border-warning/30 bg-warning-bg/20'
                      : 'border-divider bg-navy-50/40'
              }`}
            >
              {/* Student */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Monogram label={r.studentName} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy-900 truncate">{r.studentName}</p>
                  <p className="text-[10.5px] text-secondary-text truncate">{r.studentEmail}</p>
                </div>
              </div>

              {/* Status buttons */}
              <div className="flex gap-1.5 shrink-0">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(r.id, s)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      override.status === s
                        ? s === 'present'
                          ? 'bg-success text-white border-success'
                          : s === 'absent'
                            ? 'bg-danger text-white border-danger'
                            : s === 'late'
                              ? 'bg-warning text-navy-900 border-warning'
                              : 'bg-navy-500 text-white border-navy-500'
                        : 'surface-panel text-secondary-text hover:border-navy-300'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <input
                type="text"
                placeholder="Note (optional)"
                value={override.note}
                onChange={(e) => setNote(r.id, e.target.value)}
                className="w-full sm:w-40 px-2.5 py-1.5 text-[11.5px] input-surface rounded-lg text-navy-900 placeholder:text-secondary-text focus:outline-none focus:ring-1 focus:ring-lemon-500/40"
              />

              {/* Current status badge */}
              <StatusPill label={cfg.label} tone={cfg.tone} />
            </div>
          )
        })}

        {records.length === 0 && (
          <p className="py-6 text-center text-[13px] text-secondary-text">
            No students enrolled in this course yet.
          </p>
        )}
      </div>
    </Modal>
  )
}

// ─── Student History Modal ────────────────────────────────────────────────────

function StudentHistoryModal({
  record,
  open,
  onClose,
}: {
  record: AttendanceRecord | null
  open: boolean
  onClose: () => void
}) {
  if (!record) return null

  const sorted = [...record.history].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance History"
      description={`${record.studentName} — ${record.courseCode}`}
      icon={<CalendarDays size={18} />}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* Summary */}
      <div className="flex items-center gap-5 rounded-xl bg-navy-50/60 border border-divider px-4 py-3">
        <AttendanceRing rate={record.attendancePercent} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-[12px]">
          <div>
            <span className="text-secondary-text">Present </span>
            <span className="font-bold text-success">{record.present}</span>
          </div>
          <div>
            <span className="text-secondary-text">Absent </span>
            <span className="font-bold text-danger">{record.absent}</span>
          </div>
          <div>
            <span className="text-secondary-text">Late </span>
            <span className="font-bold text-[#8A6D00]">{record.late}</span>
          </div>
          <div>
            <span className="text-secondary-text">Excused </span>
            <span className="font-bold text-navy-500">{record.excused}</span>
          </div>
        </div>
      </div>

      {/* History list */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[360px]">
            <thead>
              <tr className="table-header-label border-b border-divider table-header-bar">
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((session, i) => {
                const cfg = STATUS_CONFIG[session.status]
                return (
                  <tr key={i} className="border-b border-divider last:border-0 hover:bg-navy-50/30 text-[12px]">
                    <td className="py-2.5 px-4 text-navy-700">{formatDate(session.date)}</td>
                    <td className="py-2.5 px-4">
                      <StatusPill label={cfg.label} tone={cfg.tone} />
                    </td>
                    <td className="py-2.5 px-4 text-secondary-text">{session.note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InstructorAttendancePage() {
  const { data, isLoading, isError } = useInstructorDashboard()
  const { records, overrideSession } = useAttendance()
  const { notify } = useToast()
  const person = getSessionPerson()

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('All')
  const [takeOpen, setTakeOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(todayIso())
  const [historyRecord, setHistoryRecord] = useState<AttendanceRecord | null>(null)
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)

  // Records scoped to this instructor only
  const myRecords = useMemo(() => {
    if (!person) return []
    return records.filter(
      (r) => r.instructorId === person.id || r.instructorName === person.name,
    )
  }, [records, person])

  // Unique courses the instructor teaches (from attendance records)
  const myCourses = useMemo(() => {
    const seen = new Map<string, { id: string; code: string; title: string }>()
    for (const r of myRecords) {
      if (!seen.has(r.courseId)) {
        seen.set(r.courseId, { id: r.courseId, code: r.courseCode, title: r.courseTitle })
      }
    }
    // Also include courses from the dashboard even if no attendance records yet
    if (data) {
      for (const c of data.courses) {
        if (!seen.has(c.id)) {
          seen.set(c.id, { id: c.id, code: c.code, title: c.title })
        }
      }
    }
    return Array.from(seen.values())
  }, [myRecords, data])

  // Auto-select first course
  const effectiveCourseId = selectedCourseId || myCourses[0]?.id || ''
  const selectedCourse = myCourses.find((c) => c.id === effectiveCourseId)

  // Records for the selected course
  const courseRecords = useMemo(
    () => myRecords.filter((r) => r.courseId === effectiveCourseId),
    [myRecords, effectiveCourseId],
  )

  // Filtered by status tab
  const filtered = useMemo(() => {
    if (activeTab === 'All') return courseRecords
    const map: Record<string, AttendanceStatus> = {
      Present: 'present',
      Absent: 'absent',
      Late: 'late',
      Excused: 'excused',
    }
    const target = map[activeTab]
    if (!target) return courseRecords
    // Filter by latest session status
    return courseRecords.filter((r) => {
      const latest = r.history[r.history.length - 1]
      return latest?.status === target
    })
  }, [courseRecords, activeTab])

  // Course-level stats
  const courseStats = useMemo(() => {
    if (courseRecords.length === 0) {
      return { rate: 0, present: 0, absent: 0, late: 0, atRisk: 0 }
    }
    const rate = Math.round(
      courseRecords.reduce((sum, r) => sum + r.attendancePercent, 0) / courseRecords.length,
    )
    const atRisk = courseRecords.filter((r) => r.riskLevel === 'at-risk').length

    // Sum last-session counts
    let present = 0, absent = 0, late = 0
    for (const r of courseRecords) {
      const latest = r.history[r.history.length - 1]
      if (latest?.status === 'present') present++
      else if (latest?.status === 'absent') absent++
      else if (latest?.status === 'late') late++
    }
    return { rate, present, absent, late, atRisk }
  }, [courseRecords])

  // History — get unique session dates across all students in this course
  const sessionDates = useMemo(() => {
    const dates = new Set<string>()
    for (const r of courseRecords) {
      for (const h of r.history) dates.add(h.date)
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a)).slice(0, 8)
  }, [courseRecords])

  const handleSaveAttendance = (
    overrides: Record<string, { status: AttendanceStatus; note: string }>,
  ) => {
    for (const [recordId, { status, note }] of Object.entries(overrides)) {
      overrideSession(recordId, sessionDate, status, note || undefined)
    }
    setTakeOpen(false)
    notify(`Attendance saved for ${selectedCourse?.code ?? 'course'} — ${formatDate(sessionDate)}.`)
  }

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load attendance data." />

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* ── Header ── */}
        <PageHeader
          title="Attendance"
          subtitle="Record and monitor attendance for your courses."
          actions={
            <Button
              variant="primary"
              onClick={() => {
                setSessionDate(todayIso())
                setTakeOpen(true)
              }}
              disabled={myCourses.length === 0}
            >
              <ClipboardCheck size={15} />
              Take attendance
            </Button>
          }
        />

        {/* ── Overall banner ── */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 hero-banner-br shadow-[var(--shadow-card)]">
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-lemon-500/10 blur-3xl pointer-events-none" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <AttendanceRing rate={courseStats.rate} onDark />
            <div className="flex-1 text-white min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">
                {selectedCourse ? `${selectedCourse.code} — Attendance rate` : 'Overall attendance'}
              </div>
              <h2 className="mt-2 text-[28px] md:text-[32px] font-bold leading-none">
                {courseStats.rate}%
              </h2>
              <p className="mt-2 text-[13px] text-[#c5cade]">
                {courseRecords.length} student{courseRecords.length === 1 ? '' : 's'} · {data.term}
              </p>
            </div>
            {/* Course picker */}
            <div className="relative shrink-0" >
              <button
                type="button"
                onClick={() => setCourseDropdownOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-[13px] font-semibold hover:bg-white/20 transition-colors cursor-pointer"
              >
                {selectedCourse ? selectedCourse.code : 'Select course'}
                <ChevronDown size={14} className={courseDropdownOpen ? 'rotate-180' : ''} />
              </button>
              {courseDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 surface-panel rounded-xl shadow-lg z-30 py-1.5">
                  {myCourses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(c.id)
                        setActiveTab('All')
                        setCourseDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[12.5px] transition-colors hover:bg-navy-50 ${
                        effectiveCourseId === c.id
                          ? 'bg-lemon-500/10 font-semibold text-navy-900'
                          : 'text-navy-900'
                      }`}
                    >
                      <span className="font-bold">{c.code}</span>
                      <span className="ml-2 text-secondary-text">{c.title}</span>
                    </button>
                  ))}
                  {myCourses.length === 0 && (
                    <p className="px-4 py-3 text-[12px] text-secondary-text">No courses assigned.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <StatBlock
            label="Attendance rate"
            value={`${courseStats.rate}%`}
            sub={selectedCourse?.code ?? 'All courses'}
            icon={<ClipboardCheck size={17} />}
            iconBg="bg-lemon-50 text-lemon-900"
          />
          <StatBlock
            label="Present"
            value={courseStats.present}
            sub="Last session"
            icon={<CheckCircle2 size={17} />}
            iconBg="bg-success-bg text-success"
          />
          <StatBlock
            label="Absent"
            value={courseStats.absent}
            sub="Last session"
            icon={<XCircle size={17} />}
            iconBg="bg-danger-bg text-danger"
          />
          <StatBlock
            label="Late"
            value={courseStats.late}
            sub="Last session"
            icon={<Clock size={17} />}
            iconBg="bg-warning-bg text-[#8A6D00]"
          />
          <StatBlock
            label="Students at risk"
            value={courseStats.atRisk}
            sub="< 60% attendance"
            icon={<AlertTriangle size={17} />}
            iconBg="bg-danger-bg text-danger"
          />
        </div>

        {/* ── Filter tabs + count ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />
          <span className="text-[12px] text-secondary-text shrink-0">
            {filtered.length} student{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* ── Student attendance table ── */}
        <GlassCard className="overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-bold text-navy-900">
                {selectedCourse
                  ? `${selectedCourse.code} — ${selectedCourse.title}`
                  : 'Select a course'}
              </h3>
              <p className="text-[12px] text-secondary-text mt-0.5">
                Per-student attendance overview
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="table-header-label border-b border-divider table-header-bar">
                  <th className="py-3 pl-5 pr-3 font-semibold">Student</th>
                  <th className="py-3 px-3 font-semibold">Attendance %</th>
                  <th className="py-3 px-3 font-semibold">Present</th>
                  <th className="py-3 px-3 font-semibold">Absent</th>
                  <th className="py-3 px-3 font-semibold">Late</th>
                  <th className="py-3 px-3 font-semibold">Last session</th>
                  <th className="py-3 px-3 font-semibold">Risk</th>
                  <th className="py-3 pl-3 pr-5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
                        <Users size={28} className="text-navy-300" />
                        <p className="text-[13px] font-semibold text-navy-900">
                          {myCourses.length === 0
                            ? 'No courses assigned yet'
                            : activeTab !== 'All'
                              ? 'No students match this filter'
                              : 'No students enrolled in this course yet'}
                        </p>
                        <p className="text-[12px] text-secondary-text max-w-xs leading-relaxed">
                          {myCourses.length === 0
                            ? 'Ask an admin to assign courses to your account.'
                            : 'Students appear here once enrolled in your courses.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => {
                    const latestSession = record.history[record.history.length - 1]
                    const latestCfg = latestSession
                      ? STATUS_CONFIG[latestSession.status]
                      : null
                    return (
                      <tr
                        key={record.id}
                        className="border-b border-divider last:border-0 table-row-hover text-[12px]"
                      >
                        {/* Student */}
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Monogram label={record.studentName} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-navy-900 leading-snug truncate max-w-[140px]">
                                {record.studentName}
                              </p>
                              <p className="text-[10.5px] text-secondary-text truncate max-w-[140px]">
                                {record.studentEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Attendance % */}
                        <td className="py-3 px-3 min-w-[110px]">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={record.attendancePercent} className="flex-1" />
                            <span className="text-[11px] font-bold text-navy-900 tabular-nums w-8 text-right shrink-0">
                              {record.attendancePercent}%
                            </span>
                          </div>
                        </td>

                        {/* Counts */}
                        <td className="py-3 px-3 font-bold text-success">{record.present}</td>
                        <td className="py-3 px-3 font-bold text-danger">{record.absent}</td>
                        <td className="py-3 px-3 font-bold text-[#8A6D00]">{record.late}</td>

                        {/* Last session */}
                        <td className="py-3 px-3">
                          {latestCfg && latestSession ? (
                            <div className="flex items-center gap-1.5">
                              <StatusPill label={latestCfg.label} tone={latestCfg.tone} />
                              <span className="text-[10.5px] text-secondary-text">
                                {latestSession.date}
                              </span>
                            </div>
                          ) : (
                            <span className="text-navy-300">—</span>
                          )}
                        </td>

                        {/* Risk */}
                        <td className="py-3 px-3">
                          <StatusPill
                            label={RISK_LABEL[record.riskLevel]}
                            tone={RISK_TONE[record.riskLevel]}
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-3 pr-5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryRecord(record)}
                          >
                            <CalendarDays size={13} />
                            History
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* ── Attendance history by session ── */}
        {sessionDates.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold text-navy-900">Session History</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sessionDates.map((date) => {
                let present = 0, absent = 0, late = 0, excused = 0
                for (const r of courseRecords) {
                  const session = r.history.find((h) => h.date === date)
                  if (!session) continue
                  if (session.status === 'present') present++
                  else if (session.status === 'absent') absent++
                  else if (session.status === 'late') late++
                  else if (session.status === 'excused') excused++
                }
                const total = present + absent + late + excused
                const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

                return (
                  <GlassCard key={date} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">
                          {formatDate(date)}
                        </p>
                        <p className="mt-1 text-[22px] font-bold text-navy-900 leading-none">
                          {rate}%
                        </p>
                      </div>
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          rate >= 80
                            ? 'bg-success-bg text-success'
                            : rate >= 60
                              ? 'bg-info-bg text-info'
                              : 'bg-danger-bg text-danger'
                        }`}
                      >
                        <ClipboardCheck size={17} />
                      </div>
                    </div>
                    <ProgressBar value={rate} className="mt-3" />
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      <span className="text-success font-semibold">{present} present</span>
                      <span className="text-danger font-semibold">{absent} absent</span>
                      {late > 0 && (
                        <span className="text-[#8A6D00] font-semibold">{late} late</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full justify-center"
                      onClick={() => {
                        setSessionDate(date)
                        setTakeOpen(true)
                      }}
                    >
                      <PenLine size={13} />
                      Edit session
                    </Button>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Scope note ── */}
        <GlassCard className="p-4 flex items-start gap-3 border-info/20 bg-info-bg/40">
          <ClipboardCheck size={16} className="text-info shrink-0 mt-0.5" />
          <p className="text-[12px] text-info leading-relaxed">
            <span className="font-semibold">Instructor scope: </span>
            Attendance data shown is scoped to your courses and students only. Institution-wide
            attendance reports are available to admins.
          </p>
        </GlassCard>
      </div>

      {/* ── Take Attendance Modal ── */}
      {selectedCourse && (
        <TakeAttendanceModal
          open={takeOpen}
          onClose={() => setTakeOpen(false)}
          records={courseRecords}
          courseCode={selectedCourse.code}
          courseTitle={selectedCourse.title}
          date={sessionDate}
          onDateChange={setSessionDate}
          onSave={handleSaveAttendance}
        />
      )}

      {/* ── Student History Modal ── */}
      <StudentHistoryModal
        record={historyRecord}
        open={historyRecord !== null}
        onClose={() => setHistoryRecord(null)}
      />
    </>
  )
}

export default InstructorAttendancePage
