import { useMemo, useState } from 'react'
import { AlertTriangle, Mail, Search, UserRound, Users } from 'lucide-react'
import { FilterTabs } from '../../../shared/components/FilterTabs'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StatBlock } from '../../../shared/components/StatBlock'
import { StatusPill } from '../../../shared/components/StatusPill'
import { Monogram } from '../../../shared/components/Monogram'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { InstructorPageError, InstructorPageLoading } from '../components/InstructorPageStates'
import { useInstructorDashboard } from '../hooks/useInstructorDashboard'
import type { StudentRosterItem } from '../types'

const tabs = ['All', 'Active', 'At risk', 'Inactive']

const statusTone: Record<StudentRosterItem['status'], 'success' | 'danger' | 'neutral'> = {
  active: 'success',
  'at-risk': 'danger',
  inactive: 'neutral',
}

const statusLabel: Record<StudentRosterItem['status'], string> = {
  active: 'Active',
  'at-risk': 'At risk',
  inactive: 'Inactive',
}

export function InstructorStudentsPage() {
  const { data, isLoading, isError } = useInstructorDashboard()
  const [activeTab, setActiveTab] = useState('All')

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, atRisk: 0, avgGrade: '—' }
    const avgGrade =
      data.students.length > 0
        ? Math.round(data.students.reduce((sum, s) => sum + s.avgGrade, 0) / data.students.length)
        : 0
    return {
      total: data.students.length,
      active: data.students.filter((s) => s.status === 'active').length,
      atRisk: data.students.filter((s) => s.status === 'at-risk').length,
      avgGrade: `${avgGrade}%`,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeTab === 'Active') return data.students.filter((s) => s.status === 'active')
    if (activeTab === 'At risk') return data.students.filter((s) => s.status === 'at-risk')
    if (activeTab === 'Inactive') return data.students.filter((s) => s.status === 'inactive')
    return data.students
  }, [data, activeTab])

  if (isLoading) return <InstructorPageLoading />
  if (isError || !data) return <InstructorPageError message="Failed to load student roster." />

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Student Roster"
        subtitle="View enrolled students, attendance rates, and performance across your courses."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBlock
          label="Total students"
          value={stats.total}
          sub="In your courses"
          icon={<Users size={17} />}
          iconBg="bg-navy-50 text-navy-600"
        />
        <StatBlock
          label="Active"
          value={stats.active}
          sub="Engaged this term"
          icon={<UserRound size={17} />}
          iconBg="bg-success-bg text-success"
        />
        <StatBlock
          label="At risk"
          value={stats.atRisk}
          sub="Need follow-up"
          icon={<AlertTriangle size={17} />}
          iconBg="bg-danger-bg text-danger"
        />
        <StatBlock
          label="Avg. grade"
          value={stats.avgGrade}
          sub="Across roster"
          icon={<Search size={17} />}
          iconBg="bg-lemon-100 text-lemon-800"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <span className="text-[12px] text-secondary-text">
          {filtered.length} student{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((student) => (
          <GlassCard
            key={student.id}
            className={`p-0 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
              student.status === 'at-risk'
                ? 'border-l-danger bg-gradient-to-r from-danger-bg/30 to-card-end'
                : 'border-l-lemon-500 bg-gradient-to-r from-lemon-50/50 to-card-end'
            }`}
          >
            <div className="p-5 flex gap-4">
              <Monogram label={student.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={statusLabel[student.status]} tone={statusTone[student.status]} />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary-text">
                    {student.course}
                  </span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold text-navy-900">{student.name}</h3>
                <p className="mt-1 text-[12px] text-secondary-text flex items-center gap-1">
                  <Mail size={12} />
                  {student.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-[12px]">
                  <div>
                    <span className="text-secondary-text">Grade </span>
                    <span className="font-bold text-navy-900">{student.avgGrade}%</span>
                  </div>
                  <div>
                    <span className="text-secondary-text">Attendance </span>
                    <span className="font-bold text-navy-900">{student.attendanceRate}%</span>
                  </div>
                  <div>
                    <span className="text-secondary-text">Last active </span>
                    <span className="font-semibold text-navy-700">{student.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center max-w-lg mx-auto">
          <Users size={32} className="mx-auto text-navy-300 mb-3" />
          <p className="text-[14px] font-semibold text-navy-900">No students on your roster yet</p>
          <p className="text-[12.5px] text-secondary-text mt-2 leading-relaxed">
            Students appear here after an admin enrolls them in your courses at{' '}
            <strong>Admin → Enrollments</strong>. Assigning a student to the same department as a
            course does not enroll them automatically.
          </p>
        </GlassCard>
      ) : null}
    </div>
  )
}

export default InstructorStudentsPage
