import { GlassCard } from '../../../shared/layout/GlassCard'
import { DepartmentCard } from './DepartmentCard'
import type { Department } from '../types'

interface DepartmentGridProps {
  departments: Department[]
  onAddDepartment?: () => void
}

export function DepartmentGrid({ departments, onAddDepartment }: DepartmentGridProps) {
  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-[17px] text-navy-900 leading-none">Departments</h3>
          <button
            onClick={onAddDepartment}
            className="text-lemon-700 hover:text-lemon-900 font-bold text-[12.5px] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            + Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              name={dept.name}
              headName={dept.headName}
              studentsCount={dept.studentsCount}
              facultyCount={dept.facultyCount}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
