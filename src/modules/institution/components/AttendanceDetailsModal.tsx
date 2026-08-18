import { useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, PenLine, Save, X, XCircle, AlertCircle } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { AttendanceRecord, AttendanceRiskLevel, AttendanceStatus } from '../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; tone: 'success' | 'danger' | 'warning' | 'info'; icon: typeof CheckCircle2 }
> = {
  present: { label: 'Present', tone: 'success', icon: CheckCircle2 },
  absent: { label: 'Absent', tone: 'danger', icon: XCircle },
  late: { label: 'Late', tone: 'warning', icon: Clock },
  excused: { label: 'Excused', tone: 'info', icon: AlertCircle },
}

const RISK_CONFIG: Record<AttendanceRiskLevel, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  good: { label: 'Good standing', tone: 'success' },
  warning: { label: 'Warning', tone: 'warning' },
  'at-risk': { label: 'At risk', tone: 'danger' },
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary-text">
        {label}
      </span>
      <span className="text-[13.5px] font-medium text-navy-900">{value}</span>
    </div>
  )
}

// ─── SVG ring ─────────────────────────────────────────────────────────────────

function AttendanceRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 32
  const offset = circumference - (rate / 100) * circumference
  const color = rate >= 80 ? '#16A34A' : rate >= 60 ? '#1976D2' : '#E53935'
  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="32" fill="none" stroke="#EEF1F8" strokeWidth="5" />
        <circle cx="36" cy="36" r="32" fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-extrabold text-navy-900 leading-none">{rate}%</span>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttendanceDetailsModalProps {
  open: boolean
  record: AttendanceRecord | null
  onClose: () => void
  onSaveOverride: (recordId: string, date: string, status: AttendanceStatus, note?: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceDetailsModal({
  open,
  record,
  onClose,
  onSaveOverride,
}: AttendanceDetailsModalProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present')
  const [editNote, setEditNote] = useState('')

  if (!record) return null

  const risk = RISK_CONFIG[record.riskLevel]
  const sortedHistory = [...record.history].sort((a, b) => b.date.localeCompare(a.date))

  const startEdit = (date: string, currentStatus: AttendanceStatus, currentNote?: string) => {
    setEditingDate(date)
    setEditStatus(currentStatus)
    setEditNote(currentNote ?? '')
  }

  const cancelEdit = () => {
    setEditingDate(null)
    setEditNote('')
  }

  const saveEdit = () => {
    if (!editingDate) return
    onSaveOverride(record.id, editingDate, editStatus, editNote || undefined)
    setEditingDate(null)
    setEditNote('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance Details"
      description={`${record.studentName} — ${record.courseCode}`}
      icon={<CalendarDays size={18} />}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          <X size={13} />
          Close
        </Button>
      }
    >
      {/* Student summary banner */}
      <div className="flex items-center gap-4 rounded-xl bg-navy-50/60 border border-divider px-4 py-3">
        <Monogram label={record.studentName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-navy-900">{record.studentName}</p>
          {record.studentEmail && (
            <p className="text-[12px] text-secondary-text">{record.studentEmail}</p>
          )}
        </div>
        <AttendanceRing rate={record.attendancePercent} />
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-2">
        <StatusPill label={risk.label} tone={risk.tone} />
        <span className="text-[12px] text-secondary-text">
          {record.totalSessions} sessions tracked
        </span>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <DetailRow label="Course" value={`${record.courseCode} — ${record.courseTitle}`} />
        <DetailRow label="Instructor" value={record.instructorName} />
        <DetailRow label="Department" value={record.department} />
        <DetailRow label="Attendance" value={`${record.attendancePercent}%`} />
        <DetailRow label="Present" value={String(record.present)} />
        <DetailRow label="Absent" value={String(record.absent)} />
        <DetailRow label="Late" value={String(record.late)} />
        <DetailRow label="Excused" value={String(record.excused)} />
        {record.lastSessionDate && (
          <DetailRow label="Last session" value={formatDate(record.lastSessionDate)} />
        )}
      </div>

      {/* History table with inline edit */}
      <GlassCard className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-divider bg-navy-50/30">
          <p className="text-[12px] font-bold text-navy-900">Session History</p>
          <p className="text-[11px] text-secondary-text mt-0.5">
            Click <strong>Edit</strong> on any session to correct attendance.
          </p>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto app-scroll">
          <table className="w-full min-w-[440px] text-left">
            <thead className="sticky top-0 z-10">
              <tr className="text-[10px] uppercase tracking-wider text-secondary-text border-b border-divider bg-white">
                <th className="py-2.5 pl-4 pr-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Note</th>
                <th className="py-2.5 pl-3 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((session, i) => {
                const cfg = STATUS_CONFIG[session.status]
                const isEditing = editingDate === session.date

                return (
                  <tr key={i} className="border-b border-divider last:border-0 text-[12px] hover:bg-navy-50/30 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-navy-700 whitespace-nowrap font-medium">
                      {formatDate(session.date)}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditStatus(s)}
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border cursor-pointer transition-all
                                ${editStatus === s
                                  ? s === 'present' ? 'bg-success text-white border-success'
                                    : s === 'absent' ? 'bg-danger text-white border-danger'
                                    : s === 'late' ? 'bg-warning text-navy-900 border-warning'
                                    : 'bg-info text-white border-info'
                                  : 'bg-white text-secondary-text border-divider hover:border-navy-200'
                                }`}
                            >
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <StatusPill label={cfg.label} tone={cfg.tone} />
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add note…"
                          className="w-full px-2 py-1 text-[11.5px] border border-divider rounded-lg bg-white text-navy-900 placeholder:text-secondary-text focus:outline-none focus:ring-1 focus:ring-lemon-500/40"
                        />
                      ) : (
                        <span className="text-secondary-text">{session.note ?? '—'}</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-3 pr-4">
                      {isEditing ? (
                        <div className="inline-flex gap-1">
                          <Button variant="primary" size="sm" onClick={saveEdit}>
                            <Save size={12} />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(session.date, session.status, session.note)}
                        >
                          <PenLine size={12} />
                          Edit
                        </Button>
                      )}
                    </td>
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
