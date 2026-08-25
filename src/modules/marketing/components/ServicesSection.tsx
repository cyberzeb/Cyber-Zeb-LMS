import { BarChart3, BookOpen, Check, CreditCard, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AnimateInView } from '../../../shared/components/AnimateInView'

interface ServiceItem {
  icon: LucideIcon
  title: string
  text: string
  points: string[]
}

const SERVICES: ServiceItem[] = [
  {
    icon: BookOpen,
    title: 'Academic & Course Management',
    text: 'Build your full academic structure and course catalog with rich content authoring.',
    points: ['Programs, terms & cohorts', 'Course & lesson authoring', 'SCORM / xAPI content support'],
  },
  {
    icon: FileText,
    title: 'Assessment & Gradebook',
    text: 'Quizzes, assignments, rubrics and a weighted gradebook that feeds transcripts and certificates.',
    points: ['Question bank & quizzes', 'Weighted grading rules', 'Auto-issued certificates'],
  },
  {
    icon: CreditCard,
    title: 'Payments & Invoicing',
    text: 'Request-to-invoice workflow with verified payment webhooks and automatic access activation.',
    points: ['Custom institutional invoicing', 'Local & international payment rails', 'Reconciliation dashboard'],
  },
  {
    icon: BarChart3,
    title: 'Reports, Analytics & AI',
    text: 'Role-aware dashboards and phased AI features — recommendations, risk alerts and reporting.',
    points: ['Executive & instructor dashboards', 'At-risk learner indicators', 'Exportable compliance reports'],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="bg-[#1B2340] py-20 md:py-28 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-lemon-500/10 blur-[120px] marketing-hero-glow" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
        <AnimateInView className="max-w-2xl mx-auto text-center">
          <span className="text-lemon-500 font-bold text-[12px] uppercase tracking-wider">Our Services</span>
          <h2 className="mt-3 text-[30px] md:text-[38px] font-extrabold text-white leading-tight">
            Everything your institution needs, in one platform
          </h2>
          <p className="mt-4 text-[14.5px] text-[#C5CADE]">
            Enable only the modules you need today — expand any time as your institution grows.
          </p>
        </AnimateInView>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((s, index) => {
            const Icon = s.icon
            return (
              <AnimateInView key={s.title} delay={index * 0.08}>
                <div className="marketing-service-card group h-full bg-white/[0.06] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.09] hover:border-lemon-500/40">
                  <div className="w-11 h-11 rounded-xl bg-lemon-500/15 flex items-center justify-center text-lemon-500 mb-4 group-hover:bg-lemon-500 group-hover:text-[#020810] group-hover:scale-110 transition-all duration-300">
                    <Icon size={22} strokeWidth={2.25} />
                  </div>
                  <h3 className="text-[15.5px] font-extrabold text-white mb-2">{s.title}</h3>
                  <p className="text-[13.5px] text-[#C5CADE] leading-relaxed mb-4">{s.text}</p>
                  <ul className="space-y-1.5">
                    {s.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-[12.5px] text-[#C5CADE]">
                        <Check size={14} className="text-lemon-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
