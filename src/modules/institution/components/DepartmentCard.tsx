import { Trash2 } from 'lucide-react'
import { Monogram } from '../../../shared/components/Monogram'

interface DepartmentCardProps {
  name: string
  headName: string
  studentsCount: number
  facultyCount: number
  icon?: string
  onDelete?: () => void
}

export function DepartmentCard({
  name,
  headName,
  studentsCount,
  facultyCount,
  onDelete,
}: DepartmentCardProps) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-xl border border-divider/60 bg-white/40 hover:bg-white/80 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete department"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-secondary-text hover:text-danger hover:bg-danger-bg w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div className="flex gap-3.5 items-start">
        <div className="group-hover:scale-105 transition-transform duration-300">
          <Monogram label={name} size="md" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-navy-900 text-[14.5px] leading-snug tracking-tight truncate">
            {name}
          </h4>
          <p className="text-[11.5px] text-secondary-text mt-0.5 leading-none">
            Head: <span className="text-navy-700 font-medium">{headName}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-6 mt-4.5 pt-3 border-t border-divider/40">
        <div>
          <div className="text-[13px] font-extrabold text-navy-900">
            {studentsCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-secondary-text uppercase tracking-wider font-semibold">
            Students
          </div>
        </div>
        <div>
          <div className="text-[13px] font-extrabold text-navy-900">
            {facultyCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-secondary-text uppercase tracking-wider font-semibold">
            Faculty
          </div>
        </div>
      </div>
    </div>
  )
}
