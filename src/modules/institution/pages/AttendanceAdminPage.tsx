import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserRoundCheck,
  XCircle,
} from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SelectMenu } from '../../../shared/components/SelectMenu'
import { DepartmentSelectMenu } from '../../../shared/components/DepartmentSelectMenu'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { useCampusContext } from '../context/CampusContext'
import { useSyncCampusFilter } from '../hooks/useSyncCampusFilter'
import { useAttendance } from '../hooks/useAttendance'
import { computeAttendanceSummary } from '../data/attendanceSeedData'
import { AttendanceTable } from '../components/AttendanceTable'
import { AttendanceDetailsModal } from '../components/AttendanceDetailsModal'
import { AttendanceReportsPanel } from '../components/AttendanceReportsPanel'
import type { AttendanceRecord, AttendanceStatus } from '../types'

// ─── Filter option builders ───────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'good', label: 'Good standing' },
  { value: 'warning', label: 'Warning' },
  { value: 'at-risk', label: 'At risk' },
]

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
]

function matchesDateFilter(record: AttendanceRecord, filter: string): boolean {
  if (filter === 'all') return true
  const lastDate = record.lastSessionDate
  if (!lastDate) return false
  const date = new Date(lastDate)
  const cutoff = new Date()
  const days = filter === 'last7' ? 7 : filter === 'last30' ? 30 : 90
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AttendanceAdminPage() {
  const { notify } = useToast()
  const { campuses, departments, activeCampuses, selectedCampusId } = useCampusContext()
  const { records, overrideSession } = useAttendance()

  // ── Filter state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [instructorFilter, setInstructorFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // ── Modal state ───────────────────────────────────────────────────────────
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null)

  // ── Sync campus header selector ───────────────────────────────────────────
  useSyncCampusFilter(selectedCampusId, setCampusFilter)

  useEffect(() => {
    setDepartmentFilter('all')
  }, [selectedCampusId])

  // ── Derived filter options ────────────────────────────────────────────────
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of records) {
      if (!seen.has(r.courseId)) seen.set(r.courseId, `${r.courseCode} — ${r.courseTitle}`)
    }
    return [
      { value: 'all', label: 'All courses' },
      ...Array.from(seen.entries()).map(([id, label]) => ({ value: id, label })),
    ]
  }, [records])

  const instructorOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of records) {
      if (!seen.has(r.instructorId)) seen.set(r.instructorId, r.instructorName)
    }
    return [
      { value: 'all', label: 'All instructors' },
      ...Array.from(seen.entries()).map(([id, label]) => ({ value: id, label })),
    ]
  }, [records])

  const campusMenuOptions = useMemo(
    () => [
      { value: 'all', label: 'All campuses' },
      ...activeCampuses.map((c) => ({ value: c.id, label: c.name, hint: c.code })),
    ],
    [activeCampuses],
  )

  // ── Filtered records ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const deptName = departments.find((d) => d.id === departmentFilter)?.name

    return records.filter((r) => {
      if (campusFilter !== 'all' && r.campusId !== campusFilter) return false
      if (deptName && r.department !== deptName) return false
      if (statusFilter !== 'all' && r.riskLevel !== statusFilter) return false
      if (courseFilter !== 'all' && r.courseId !== courseFilter) return false
      if (instructorFilter !== 'all' && r.instructorId !== instructorFilter) return false
      if (!matchesDateFilter(r, dateFilter)) return false
      if (q) {
        const match =
          r.studentName.toLowerCase().includes(q) ||
          r.studentEmail.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q) ||
          r.courseTitle.toLowerCase().includes(q) ||
          r.instructorName.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [records, query, campusFilter, departmentFilter, statusFilter, courseFilter, instructorFilter, dateFilter, departments])

  // ── Summary stats — always over unfiltered records for the selected campus ─
  const summary = useMemo(() => {
    const scoped =
      campusFilter === 'all' ? records : records.filter((r) => r.campusId === campusFilter)
    return computeAttendanceSummary(scoped)
  }, [records, campusFilter])

  // ── Override handler ──────────────────────────────────────────────────────
  const handleSaveOverride = (
    recordId: string,
    date: string,
    status: AttendanceStatus,
    note?: string,
  ) => {
    overrideSession(recordId, date, status, note)
    const r = records.find((x) => x.id === recordId)
    notify(
      `Attendance updated for ${r?.studentName ?? 'student'} on ${date}.`,
      'success',
    )
    // Re-sync the detail record with the updated data (state will update from hook)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* ── Header ── */}
      <PageHeader
        title="Attendance"
        subtitle="Monitor attendance across your institution."
      />

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        <StatBlock
          label="Overall attendance"
          value={`${summary.overallRate}%`}
          sub="Institution-wide"
          icon={<UserRoundCheck size={17} />}
          iconBg="bg-lemon-50 text-lemon-900"
        />
        <StatBlock
          label="Present today"
          value={summary.presentToday}
          sub="Latest sessions"
          icon={<CheckCircle2 size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="Absent today"
          value={summary.absentToday}
          sub="Latest sessions"
          icon={<XCircle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Late today"
          value={summary.lateToday}
          sub="Latest sessions"
          icon={<Clock size={17} />}
          iconBg="bg-warning-bg text-[#8A6D00]"
        />
        <StatBlock
          label="Students at risk"
          value={summary.atRisk}
          sub="Below 60% rate"
          icon={<AlertTriangle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            <SelectMenu
              value={campusFilter}
              options={campusMenuOptions}
              onChange={(v) => {
                setCampusFilter(v)
                setDepartmentFilter('all')
              }}
              aria-label="Filter by campus"
              className="w-full sm:w-auto"
            />
            <DepartmentSelectMenu
              value={departmentFilter}
              departments={departments}
              campuses={campuses}
              campusFilter={campusFilter}
              onChange={setDepartmentFilter}
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={courseFilter}
              options={courseOptions}
              onChange={setCourseFilter}
              aria-label="Filter by course"
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={instructorFilter}
              options={instructorOptions}
              onChange={setInstructorFilter}
              aria-label="Filter by instructor"
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
              aria-label="Filter by attendance status"
              className="w-full sm:w-auto"
            />
            <SelectMenu
              value={dateFilter}
              options={DATE_OPTIONS}
              onChange={setDateFilter}
              aria-label="Filter by date range"
              className="w-full sm:w-auto"
            />
            <span className="text-[13px] font-semibold text-navy-700 whitespace-nowrap">
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Search */}
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search student, course, instructor…"
            className="lg:w-80"
          />
        </div>
      </div>

      {/* ── Attendance table ── */}
      {filtered.length > 0 ? (
        <AttendanceTable
          records={filtered}
          onView={setDetailRecord}
          onOverride={setDetailRecord}
        />
      ) : (
        <GlassCard className="p-10 text-center text-secondary-text text-[13.5px] font-medium">
          No attendance records match your filters.
        </GlassCard>
      )}

      {/* ── Reports panel ── */}
      <AttendanceReportsPanel records={records} />

      {/* ── Details + override modal ── */}
      <AttendanceDetailsModal
        open={detailRecord !== null}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        onSaveOverride={handleSaveOverride}
      />
    </div>
  )
}
