import { BookOpen, CalendarDays, GraduationCap, Sparkles } from 'lucide-react'
import type { StudentDashboardData } from '../types'
import { GlassCard } from '../../../shared/layout/GlassCard'

interface StudentDashboardHeroProps {
  data: Pick<StudentDashboardData, 'studentName' | 'program' | 'term' | 'standing' | 'stats'>
}

export function StudentDashboardHero({ data }: StudentDashboardHeroProps) {
  return (
    <GlassCard className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-700 to-[#202a4c] p-7 text-white">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lemon-500/25 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lemon-200">
            <Sparkles size={12} />
            Student Learning Hub
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Welcome back, {data.studentName}
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-navy-200">
            Manage your course content, assessments, assignment dropboxes, calendar events, and grade feedback from one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-navy-100">
              <BookOpen size={12} />
              {data.program}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-navy-100">
              <CalendarDays size={12} />
              {data.term}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[380px]">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-200">
              <GraduationCap size={12} />
              Academic snapshot
            </div>
            <div className="text-[24px] font-extrabold text-white">{data.stats[3].value} GPA</div>
            <p className="mt-1 text-[12px] text-navy-200">{data.stats[3].detail}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-200">
              <CalendarDays size={12} />
              Quick focus
            </div>
            <div className="text-[24px] font-extrabold text-white">{data.stats[1].value} deadlines</div>
            <p className="mt-1 text-[12px] text-navy-200">{data.stats[1].detail}</p>
          </div>
        </div>
      </div>

    </GlassCard>
  )
}