import { useMemo, useState } from 'react'
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Download,
  ExternalLink,
  Hourglass,
  Search,
  ShieldCheck,
  ShieldOff,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { Modal } from '../../../shared/components/Modal'
import { Monogram } from '../../../shared/components/Monogram'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorCertificates } from '../hooks/useInstructorCertificates'
import type { InstructorCertificateRow, InstructorCertStatus } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Issued', 'Eligible', 'Pending', 'Not eligible']

const STATUS_TONE: Record<InstructorCertStatus, 'success' | 'info' | 'warning' | 'neutral'> = {
  issued: 'success',
  eligible: 'info',
  pending: 'warning',
  'not-eligible': 'neutral',
}

const STATUS_LABEL: Record<InstructorCertStatus, string> = {
  issued: 'Issued',
  eligible: 'Eligible',
  pending: 'Pending',
  'not-eligible': 'Not eligible',
}

type SortKey = 'studentName' | 'courseCode' | 'completionPercent' | 'certStatus'
type SortDir = 'asc' | 'desc'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color =
    pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-navy-700 tabular-nums w-8 text-right">
        {pct}%
      </span>
    </div>
  )
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className = '',
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const isActive = active === sortKey
  return (
    <th
      className={`py-3 px-3 font-semibold cursor-pointer select-none whitespace-nowrap hover:text-navy-900 transition-colors ${
        isActive ? 'text-navy-900' : ''
      } ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronDown size={12} className="opacity-30" />
        )}
      </span>
    </th>
  )
}

// ─── Details Modal ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2.5 border-b border-divider/60 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-medium text-navy-900 break-all">{value}</span>
    </div>
  )
}

interface DetailsModalProps {
  row: InstructorCertificateRow | null
  open: boolean
  onClose: () => void
}

function DetailsModal({ row, open, onClose }: DetailsModalProps) {
  if (!row) return null

  const isIssued = row.certStatus === 'issued'
  const isPending = row.certStatus === 'pending'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Certificate Details"
      description={`${row.studentName} — ${row.courseCode}`}
      icon={<Award size={18} />}
      size="lg"
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={13} />
            Close
          </Button>
          {isIssued && (
            <>
              <Button variant="secondary" size="sm">
                <ExternalLink size={13} />
                View certificate
              </Button>
              <Button variant="primary" size="sm">
                <Download size={13} />
                Download
              </Button>
            </>
          )}
          {isPending && (
            <Button variant="primary" size="sm">
              <ThumbsUp size={13} />
              Approve
            </Button>
          )}
        </div>
      }
    >
      {/* Student + course banner */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 hero-banner-br">
        <div className="absolute right-0 top-0 w-36 h-36 rounded-full bg-lemon-500/15 blur-3xl pointer-events-none" />
        <div className="relative p-5 flex items-center gap-4">
          <Monogram label={row.studentName} size="md" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-lemon-400">
              {STATUS_LABEL[row.certStatus]}
            </p>
            <h3 className="mt-1 text-[17px] font-bold text-white leading-tight">
              {row.studentName}
            </h3>
            <p className="mt-0.5 text-[12px] text-[#c5cade]">
              {row.courseCode} — {row.courseTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Verification status strip */}
      <div
        className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 border ${
          isIssued
            ? 'bg-success-bg border-success/25 text-success'
            : 'bg-warning-bg border-warning/30 text-[#8A6D00]'
        }`}
      >
        {isIssued ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
        <span className="text-[12.5px] font-semibold">
          {isIssued
            ? 'Certificate issued and verified.'
            : isPending
              ? 'Certificate pending — approval required before issue.'
              : row.certStatus === 'eligible'
                ? 'Student is eligible. Certificate has not been issued yet.'
                : 'Student has not yet met the completion threshold.'}
        </span>
      </div>

      {/* Detail rows */}
      <GlassCard className="px-4 py-1 divide-y divide-divider/60">
        <DetailRow label="Student" value={row.studentName} />
        {row.studentEmail && <DetailRow label="Email" value={row.studentEmail} />}
        <DetailRow label="Course" value={`${row.courseCode} — ${row.courseTitle}`} />
        <DetailRow label="Completion" value={`${row.completionPercent}%`} />
        <DetailRow label="Final grade" value={row.finalGrade} />
        {row.completionDate && (
          <DetailRow label="Completion date" value={row.completionDate} />
        )}
        <DetailRow label="Certificate status" value={STATUS_LABEL[row.certStatus]} />
        {row.certificateId && (
          <DetailRow label="Certificate ID" value={row.certificateId} />
        )}
        {row.issuedAt && <DetailRow label="Issue date" value={row.issuedAt} />}
        {row.institution && <DetailRow label="Institution" value={row.institution} />}
      </GlassCard>
    </Modal>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <Award size={32} className="text-navy-300" />
          <p className="text-[14px] font-semibold text-navy-900">
            {hasFilters ? 'No students match your filters' : 'No students in your courses yet'}
          </p>
          <p className="text-[12px] text-secondary-text max-w-xs leading-relaxed">
            {hasFilters
              ? 'Try adjusting your search or filter criteria.'
              : 'Students will appear here once they are enrolled in your courses by an admin.'}
          </p>
        </div>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InstructorCertificatesPage() {
  const { rows, isLoading, isError } = useInstructorCertificates()

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All courses')
  const [statusTab, setStatusTab] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('studentName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedRow, setSelectedRow] = useState<InstructorCertificateRow | null>(null)

  // Unique course list for the course dropdown
  const courseOptions = useMemo(() => {
    const codes = Array.from(new Set(rows.map((r) => r.courseCode))).sort()
    return ['All courses', ...codes]
  }, [rows])

  // Summary stats
  const stats = useMemo(() => {
    const issued = rows.filter((r) => r.certStatus === 'issued').length
    const pending = rows.filter((r) => r.certStatus === 'pending').length
    const eligible = rows.filter((r) => r.certStatus === 'eligible').length
    const completed = rows.filter((r) => r.completionPercent >= 100).length
    return { issued, pending, eligible, completed, total: rows.length }
  }, [rows])

  // Filtering
  const filtered = useMemo(() => {
    let out = rows

    if (statusTab !== 'All') {
      const map: Record<string, InstructorCertStatus> = {
        Issued: 'issued',
        Eligible: 'eligible',
        Pending: 'pending',
        'Not eligible': 'not-eligible',
      }
      const target = map[statusTab]
      if (target) out = out.filter((r) => r.certStatus === target)
    }

    if (courseFilter !== 'All courses') {
      out = out.filter((r) => r.courseCode === courseFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q) ||
          r.courseTitle.toLowerCase().includes(q),
      )
    }

    return out
  }, [rows, statusTab, courseFilter, search])

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'studentName') {
        cmp = a.studentName.localeCompare(b.studentName)
      } else if (sortKey === 'courseCode') {
        cmp = a.courseCode.localeCompare(b.courseCode)
      } else if (sortKey === 'completionPercent') {
        cmp = a.completionPercent - b.completionPercent
      } else if (sortKey === 'certStatus') {
        cmp = a.certStatus.localeCompare(b.certStatus)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const hasFilters =
    search.trim() !== '' || courseFilter !== 'All courses' || statusTab !== 'All'

  if (isLoading) return <InstructorPageLoading />
  if (isError) return <InstructorPageError message="Failed to load certificate data." />

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* ── Header ── */}
        <PageHeader
          title="Certificates"
          subtitle="Manage and monitor certificates for your courses."
        />

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatBlock
            label="Students completed"
            value={stats.completed}
            sub="100% progress"
            icon={<CheckCircle2 size={17} />}
            iconBg="bg-success-bg text-success"
          />
          <StatBlock
            label="Certificates issued"
            value={stats.issued}
            sub="Verified & active"
            icon={<BadgeCheck size={17} />}
            iconBg="bg-lemon-50 text-lemon-900"
          />
          <StatBlock
            label="Pending approval"
            value={stats.pending}
            sub="Awaiting your review"
            icon={<Hourglass size={17} />}
            iconBg="bg-warning-bg text-[#8A6D00]"
          />
          <StatBlock
            label="Eligible students"
            value={stats.eligible}
            sub="Ready to certify"
            icon={<Users size={17} />}
            iconBg="bg-info-bg text-info"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3">
          {/* Status tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <FilterTabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />
            <span className="text-[12px] text-secondary-text shrink-0">
              {sorted.length} student{sorted.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Search + course dropdown */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search student or course…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12.5px] input-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-lemon-500/40 focus:border-lemon-500/60 text-navy-900 placeholder:text-secondary-text transition"
              />
            </div>

            {/* Course filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 text-[12.5px] input-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-lemon-500/40 focus:border-lemon-500/60 text-navy-900 cursor-pointer transition"
            >
              {courseOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider bg-navy-50/40">
                  <SortTh
                    label="Student"
                    sortKey="studentName"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="pl-5"
                  />
                  <SortTh
                    label="Course"
                    sortKey="courseCode"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Completion"
                    sortKey="completionPercent"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Final grade</th>
                  <SortTh
                    label="Status"
                    sortKey="certStatus"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="py-3 px-3 font-semibold whitespace-nowrap">Issue date</th>
                  <th className="py-3 px-5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} />
                ) : (
                  sorted.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-divider last:border-0 text-[12px] hover:bg-navy-50/40 transition-colors group`}
                    >
                      {/* Student */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Monogram label={row.studentName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-navy-900 leading-snug truncate max-w-[140px]">
                              {row.studentName}
                            </p>
                            {row.studentEmail && (
                              <p className="text-[10.5px] text-secondary-text truncate max-w-[140px]">
                                {row.studentEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3 px-3">
                        <p className="font-semibold text-navy-900">{row.courseCode}</p>
                        <p className="text-[10.5px] text-secondary-text truncate max-w-[130px]">
                          {row.courseTitle}
                        </p>
                      </td>

                      {/* Completion */}
                      <td className="py-3 px-3 min-w-[120px]">
                        <ProgressBar value={row.completionPercent} />
                      </td>

                      {/* Final grade */}
                      <td className="py-3 px-3 font-bold text-navy-900">{row.finalGrade}</td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusPill
                          label={STATUS_LABEL[row.certStatus]}
                          tone={STATUS_TONE[row.certStatus]}
                        />
                      </td>

                      {/* Issue date */}
                      <td className="py-3 px-3 text-secondary-text">
                        {row.issuedAt ?? (
                          <span className="text-navy-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-5">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRow(row)}
                            aria-label={`View details for ${row.studentName}`}
                          >
                            <ExternalLink size={13} />
                            Details
                          </Button>

                          {row.certStatus === 'issued' && (
                            <Button variant="secondary" size="sm">
                              <Download size={13} />
                              PDF
                            </Button>
                          )}

                          {row.certStatus === 'pending' && (
                            <Button variant="primary" size="sm">
                              <ThumbsUp size={13} />
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* ── No courses at all — instructional empty state ── */}
        {rows.length === 0 && !isLoading && (
          <GlassCard className="p-10 text-center max-w-lg mx-auto">
            <Award size={32} className="mx-auto text-navy-300 mb-3" />
            <p className="text-[14px] font-semibold text-navy-900">No students yet</p>
            <p className="text-[12.5px] text-secondary-text mt-2 leading-relaxed">
              Students appear here after they are enrolled in your courses. Ask an admin to
              assign enrollments at <strong>Admin → Enrollments</strong>.
            </p>
          </GlassCard>
        )}

        {/* ── Permissions note ── */}
        <GlassCard className="p-4 flex items-start gap-3 border-info/20 bg-info-bg/40">
          <ShieldCheck size={16} className="text-info shrink-0 mt-0.5" />
          <p className="text-[12px] text-info leading-relaxed">
            <span className="font-semibold">Instructor scope: </span>
            You can view and approve certificates only for students enrolled in your own courses.
            Certificate templates and institution-wide revocations are managed by an admin.
          </p>
        </GlassCard>
      </div>

      {/* ── Details Modal ── */}
      <DetailsModal
        row={selectedRow}
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
      />
    </>
  )
}

export default InstructorCertificatesPage
