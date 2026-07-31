interface DepartmentCardProps {
  name: string
  headName: string
  studentsCount: number
  facultyCount: number
  icon: string
}

export function DepartmentCard({
  name,
  headName,
  studentsCount,
  facultyCount,
  icon,
}: DepartmentCardProps) {
  return (
    <div className="group flex flex-col justify-between p-4 rounded-xl border border-divider/60 bg-white/40 hover:bg-white/80 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex gap-3.5 items-start">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-lemon-50 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
          {icon}
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
