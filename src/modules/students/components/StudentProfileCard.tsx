import type { ReactNode } from 'react'
import { Briefcase, Building2, CalendarDays, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Monogram } from '../../../shared/components/Monogram'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { useIsEmployeePortal, useLearnerBasePath } from '../../../shared/hooks/useLearnerBasePath'
import type { StudentDashboardData } from '../types'

interface StudentProfileCardProps {
  data: Pick<
    StudentDashboardData,
    'studentId' | 'studentName' | 'email' | 'department' | 'program' | 'term' | 'standing' | 'kpis'
  >
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg surface-panel text-navy-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-secondary-text">{label}</p>
        <p className="text-[13px] font-semibold text-navy-900 truncate">{value}</p>
      </div>
    </div>
  )
}

export function StudentProfileCard({ data }: StudentProfileCardProps) {
  const navigate = useNavigate()
  const basePath = useLearnerBasePath()
  const isEmployee = useIsEmployeePortal()
  const complianceScore = Math.round(data.kpis.attendanceRate)

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-start gap-4">
        <Monogram label={data.studentName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-bold text-navy-900 leading-tight truncate">{data.studentName}</h2>
            <StatusPill label="Active" tone="success" />
          </div>
          <p className="text-[11.5px] text-secondary-text mt-1 truncate">{data.email}</p>
          <p className="text-[10.5px] text-secondary-text mt-0.5">
            {isEmployee ? 'Employee ID' : 'ID'} · {data.studentId}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField icon={<Building2 size={14} />} label="Department" value={data.department} />
        <ProfileField
          icon={isEmployee ? <Briefcase size={14} /> : <Building2 size={14} />}
          label={isEmployee ? 'Job Role' : 'Program'}
          value={data.program}
        />
        <ProfileField
          icon={<CalendarDays size={14} />}
          label={isEmployee ? 'Review Cycle' : 'Term'}
          value={data.term}
        />
        <ProfileField
          icon={<Sparkles size={14} />}
          label={isEmployee ? 'Compliance Status' : 'Standing'}
          value={data.standing}
        />
      </div>

      <div className="mt-5 profile-stat-panel p-4 text-white">
        {isEmployee ? (
          <>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-navy-200">
              Compliance Score
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[28px] font-extrabold leading-none text-lemon-500">
                {complianceScore}%
              </span>
              <span className="text-[12px] text-navy-200 mb-1">mandatory training</span>
            </div>
            <p className="mt-2 text-[11px] text-navy-200">
              {data.kpis.activeCourses} active module{data.kpis.activeCourses === 1 ? '' : 's'} ·{' '}
              {data.kpis.dueThisWeek} due this week
            </p>
          </>
        ) : (
          <>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-navy-200">Current GPA</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[28px] font-extrabold leading-none text-lemon-500">
                {data.kpis.gpa.toFixed(2)}
              </span>
              <span className="text-[12px] text-navy-200 mb-1">/ 4.00</span>
            </div>
            <p className="mt-2 text-[11px] text-navy-200">
              {data.kpis.attendanceRate}% attendance · {data.kpis.activeCourses} active courses
            </p>
          </>
        )}
      </div>

      <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => navigate(`${basePath}/settings`)}>
        Edit profile
      </Button>
    </GlassCard>
  )
}
