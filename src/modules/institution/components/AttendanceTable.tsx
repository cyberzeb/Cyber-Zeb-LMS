import { Eye, PenLine } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import type { AttendanceRecord, AttendanceRiskLevel } from '../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const riskConfig: Record<
  AttendanceRiskLevel,
  { label: string; tone: 'success' | 'warning' | 'danger' }
> = {
  good: { label: 'Good', tone: 'success' },
  warning: { label: 'Warning', tone: 'warning' },
  'at-risk': { label: 'At risk', tone: 'danger' },
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden min-w-[50px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-navy-700 tabular-nums w-8 text-right shrink-0">
        {pct}%
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onView: (record: AttendanceRecord) => void
  onOverride: (record: AttendanceRecord) => void
}

export function AttendanceTable({ records, onView, onOverride }: AttendanceTableProps) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-divider">
        <h3 className="text-[14px] font-bold text-navy-900">
          Attendance Records ({records.length})
        </h3>
        <p className="text-[12px] text-secondary-text mt-0.5">
          Per-student attendance across all courses
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="table-header-label border-b border-divider table-header-bar">
              <th className="py-3 pl-5 pr-3 font-semibold">Student</th>
              <th className="py-3 px-3 font-semibold">Course</th>
              <th className="py-3 px-3 font-semibold">Instructor</th>
              <th className="py-3 px-3 font-semibold">Present</th>
              <th className="py-3 px-3 font-semibold">Absent</th>
              <th className="py-3 px-3 font-semibold">Late</th>
              <th className="py-3 px-3 font-semibold min-w-[130px]">Attendance %</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 pl-3 pr-5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <p className="py-10 text-center text-[13px] text-secondary-text font-medium">
                    No attendance records match your filters.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const risk = riskConfig[record.riskLevel]
                return (
                  <tr
                    key={record.id}
                    className="border-b border-divider last:border-0 text-[12px] hover:bg-navy-50/40 transition-colors"
                  >
                    {/* Student */}
                    <td className="py-3 pl-5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Monogram label={record.studentName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900 truncate max-w-[130px]">
                            {record.studentName}
                          </p>
                          {record.studentEmail && (
                            <p className="text-[10.5px] text-secondary-text truncate max-w-[130px]">
                              {record.studentEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-navy-900">{record.courseCode}</p>
                      <p className="text-[10.5px] text-secondary-text truncate max-w-[140px]">
                        {record.courseTitle}
                      </p>
                    </td>

                    {/* Instructor */}
                    <td className="py-3 px-3 text-navy-700 max-w-[130px]">
                      <p className="truncate">{record.instructorName}</p>
                    </td>

                    {/* Counts */}
                    <td className="py-3 px-3 font-bold text-success">{record.present}</td>
                    <td className="py-3 px-3 font-bold text-danger">{record.absent}</td>
                    <td className="py-3 px-3 font-bold text-[#8A6D00]">{record.late}</td>

                    {/* Attendance % */}
                    <td className="py-3 px-3 min-w-[130px]">
                      <ProgressBar value={record.attendancePercent} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <StatusPill label={risk.label} tone={risk.tone} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-5">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onView(record)}>
                          <Eye size={13} />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onOverride(record)}>
                          <PenLine size={13} />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
