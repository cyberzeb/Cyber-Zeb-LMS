import { useMemo } from 'react'
import { UserRoundCheck } from 'lucide-react'

import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readAttendances } from '../../../shared/storage/readers'
import { useLinkedStudent } from '../hooks/useLinkedStudent'

export function GuardianAttendancePage() {
  const { student } = useLinkedStudent()

  const records = useMemo(
    () => (student ? readAttendances().filter((a) => a.studentId === student.id) : []),
    [student],
  )

  const overall = useMemo(() => {
    if (records.length === 0) return null
    const sessions = records.reduce((sum, r) => sum + r.totalSessions, 0)
    const present = records.reduce((sum, r) => sum + r.present + r.late, 0)
    return sessions > 0 ? Math.round((present / sessions) * 100) : null
  }, [records])

  if (!student) {
    return (
      <GlassCard className="p-6 text-[13px] text-secondary-text">
        No student is linked to your account yet.
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Attendance" subtitle={`Class attendance for ${student.name}.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Overall attendance"
          value={overall === null ? '—' : `${overall}%`}
          sub={overall !== null && overall < 75 ? 'Below the 75% minimum' : 'Meets the minimum'}
          icon={<UserRoundCheck size={17} />}
        />
        <StatBlock label="Courses tracked" value={records.length} />
        <StatBlock label="Absences" value={records.reduce((sum, r) => sum + r.absent, 0)} />
        <StatBlock label="Late arrivals" value={records.reduce((sum, r) => sum + r.late, 0)} />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wide text-secondary-text bg-navy-50/60 dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Present</th>
                <th className="px-5 py-3 font-medium">Absent</th>
                <th className="px-5 py-3 font-medium">Late</th>
                <th className="px-5 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-divider last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-navy-900">{record.courseCode}</div>
                    <div className="text-[12px] text-secondary-text">{record.courseTitle}</div>
                  </td>
                  <td className="px-5 py-3 text-navy-900">
                    {record.present}/{record.totalSessions}
                  </td>
                  <td className="px-5 py-3 text-navy-900">{record.absent}</td>
                  <td className="px-5 py-3 text-navy-900">{record.late}</td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={`${record.attendancePercent}%`}
                      tone={record.attendancePercent >= 75 ? 'success' : 'danger'}
                    />
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-secondary-text">
                    No attendance has been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
