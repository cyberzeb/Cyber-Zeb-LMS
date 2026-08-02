import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Activity,
  ShieldCheck,
  Presentation,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import type { ReportCategory } from '../types'

interface ReportCategoryCardProps {
  category: ReportCategory
  onOpen?: (category: ReportCategory) => void
}

const iconMap: Record<string, LucideIcon> = {
  'Academic Performance': GraduationCap,
  Attendance: CalendarCheck,
  Financial: CreditCard,
  Engagement: Activity,
  'Compliance & Audit': ShieldCheck,
  'Instructor Activity': Presentation,
}

export function ReportCategoryCard({ category, onOpen }: ReportCategoryCardProps) {
  const Icon = iconMap[category.title] ?? FileText

  return (
    <GlassCard
      className="p-5 flex flex-col gap-3 cursor-pointer hover:shadow-[0_12px_32px_rgba(27,35,64,0.12)] hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lemon-50 to-lemon-200 ring-1 ring-lemon-500/20 text-lemon-900 flex items-center justify-center shadow-sm">
          <Icon size={20} strokeWidth={2.2} />
        </div>
        <span className="text-[11px] font-bold text-secondary-text bg-navy-50 px-2.5 py-1 rounded-full">
          {category.reportCount} reports
        </span>
      </div>

      <div>
        <h3 className="font-extrabold text-navy-900 text-[15px] leading-tight">{category.title}</h3>
        <p className="text-[12px] text-secondary-text mt-1.5 leading-snug">
          {category.description}
        </p>
      </div>

      <button
        onClick={() => onOpen?.(category)}
        className="text-lemon-700 hover:text-lemon-900 font-bold text-[12px] cursor-pointer bg-transparent border-none p-0 text-left mt-auto pt-1"
      >
        View reports →
      </button>
    </GlassCard>
  )
}
