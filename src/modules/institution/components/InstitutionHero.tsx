import { CheckCircle2, Clock } from 'lucide-react'
import type { InstitutionEntity } from '../types'

interface InstitutionHeroProps {
  entity: InstitutionEntity
  onEdit?: () => void
  onAddDepartment?: () => void
}

export function InstitutionHero({ entity, onEdit, onAddDepartment }: InstitutionHeroProps) {
  const stats = [
    { label: 'Colleges', value: entity.collegesCount },
    { label: 'Departments', value: entity.departmentsCount },
    { label: 'Students', value: entity.studentsCount.toLocaleString() },
    { label: 'Faculty & Staff', value: entity.facultyCount },
    { label: 'Course Completion', value: `${entity.completionRate}%` },
  ]

  return (
    <div className="relative overflow-hidden rounded-[20px] p-7 text-white bg-gradient-to-br from-navy-900 via-[#24304f] to-navy-700">
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-lemon-500/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold mb-1.5">{entity.name}</h1>
          <p className="text-[12.5px] text-navy-200 m-0">{entity.subtitle}</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold px-3 py-1 rounded-full
              ${entity.status === 'active'
                ? 'bg-lemon-500/20 text-lemon-500'
                : 'bg-white/10 text-navy-200'}`}
          >
            {entity.status === 'active' ? (
              <>
                <CheckCircle2 size={13} />
                Active Campus
              </>
            ) : (
              <>
                <Clock size={13} />
                Pending Setup
              </>
            )}
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onEdit}
            className="bg-white/10 text-white border border-white/25 font-semibold text-[12.5px] px-4 py-2 rounded-lg cursor-pointer hover:bg-white/15"
          >
            Edit Details
          </button>
          <button
            onClick={onAddDepartment}
            className="bg-lemon-500 text-navy-900 border-none font-bold text-[12.5px] px-4 py-2 rounded-lg cursor-pointer hover:bg-lemon-200"
          >
            + Add Department
          </button>
        </div>
      </div>

      <div className="relative z-10 flex gap-8 mt-6 flex-wrap">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xl font-extrabold text-lemon-500">{s.value}</div>
            <div className="text-[11px] text-navy-200 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
