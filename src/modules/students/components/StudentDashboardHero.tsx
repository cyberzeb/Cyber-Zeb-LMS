import { Building2, CalendarDays, GraduationCap, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Monogram } from '../../../shared/components/Monogram'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import type { StudentDashboardData } from '../types'

interface StudentDashboardHeroProps {
  data: Pick<
    StudentDashboardData,
    'studentName' | 'email' | 'department' | 'program' | 'term' | 'standing' | 'kpis'
  >
}

export function StudentDashboardHero({ data }: StudentDashboardHeroProps) {
  const { t } = useLanguage()
  const firstName = data.studentName.split(' ')[0]

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-navy-900 via-[#24304f] to-navy-700 p-6 md:p-7 text-white">
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-lemon-500/25 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <Monogram label={data.studentName} size="md" className="ring-2 ring-white/20" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lemon-200">
              Student learning hub
            </p>
            <h1 className="mt-1 text-2xl md:text-[28px] font-extrabold leading-tight">
              {t('common.welcomeBack')} {firstName}
            </h1>
            <p className="mt-1.5 text-[12.5px] text-navy-200 truncate">{data.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                <Building2 size={12} />
                {data.department}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                <GraduationCap size={12} />
                {data.program}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                <CalendarDays size={12} />
                {data.term}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-lemon-500/20 px-2.5 py-1 text-[11px] font-semibold text-lemon-200">
                <Sparkles size={11} />
                {data.standing}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:min-w-[420px]">
          {[
            { label: 'GPA', value: data.kpis.gpa.toFixed(2), sub: '/ 4.00' },
            { label: 'Attendance', value: `${data.kpis.attendanceRate}%`, sub: 'this term' },
            { label: 'Due soon', value: String(data.kpis.dueThisWeek), sub: 'this week' },
            { label: 'Quiz avg', value: `${data.kpis.avgQuizScore}%`, sub: 'last 3' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm"
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-navy-200">{stat.label}</div>
              <div className="mt-1 text-xl font-extrabold text-lemon-500">{stat.value}</div>
              <div className="text-[10px] text-navy-200">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-navy-200 flex items-center gap-1.5">
          <Sparkles size={13} className="text-lemon-400" />
          Focus on deadlines and live sessions first — everything else is one click away.
        </p>
        <Link
          to="/student/settings"
          className="text-[12px] font-semibold text-lemon-300 hover:text-lemon-200 transition"
        >
          Edit profile →
        </Link>
      </div>
    </div>
  )
}
