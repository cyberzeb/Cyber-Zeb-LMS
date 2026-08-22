import type { ReactNode } from 'react'
import { Building2, CalendarDays, Clock, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Monogram } from '../../../shared/components/Monogram'
import { StatusPill } from '../../../shared/components/StatusPill'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { InstructorDashboardData } from '../types'

interface InstructorProfileCardProps {
  data: Pick<
    InstructorDashboardData,
    'instructorId' | 'instructorName' | 'email' | 'title' | 'department' | 'term' | 'officeHours' | 'specialization' | 'kpis'
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
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-secondary-text">{label}</div>
        <div className="text-[13px] font-semibold text-navy-900 truncate">{value}</div>
      </div>
    </div>
  )
}

export function InstructorProfileCard({ data }: InstructorProfileCardProps) {
  const navigate = useNavigate()

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-start gap-4">
        <Monogram label={data.instructorName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-bold text-navy-900 leading-tight truncate">{data.instructorName}</h2>
            <StatusPill label="Active" tone="success" />
          </div>
          <p className="text-[11.5px] text-secondary-text mt-1 truncate">{data.email}</p>
          <p className="text-[10.5px] text-secondary-text mt-0.5">{data.title} · ID · {data.instructorId}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField icon={<Building2 size={14} />} label="Department" value={data.department} />
        <ProfileField icon={<Sparkles size={14} />} label="Specialization" value={data.specialization} />
        <ProfileField icon={<CalendarDays size={14} />} label="Term" value={data.term} />
        <ProfileField icon={<Clock size={14} />} label="Office hours" value={data.officeHours} />
      </div>

      <div className="mt-5 profile-stat-panel p-4 text-white">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#c5cade]">Teaching load</div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-[28px] font-extrabold leading-none text-lemon-500">
            {data.kpis.activeCourses}
          </span>
          <span className="text-[12px] text-[#c5cade] mb-1">active courses</span>
        </div>
        <p className="mt-2 text-[11px] text-[#c5cade]">
          {data.kpis.totalStudents} students · {data.kpis.pendingGrading} pending to grade
        </p>
      </div>

      <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => navigate('/instructor/settings')}>
        Edit profile
      </Button>
    </GlassCard>
  )
}
