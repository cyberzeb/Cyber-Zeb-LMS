interface ServiceItem {
  icon: string
  title: string
  text: string
  points: string[]
}

const SERVICES: ServiceItem[] = [
  {
    icon: '📚',
    title: 'Academic & Course Management',
    text: 'Build your full academic structure and course catalog with rich content authoring.',
    points: ['Programs, terms & cohorts', 'Course & lesson authoring', 'SCORM / xAPI content support'],
  },

  {
    icon: '📝',
    title: 'Assessment & Gradebook',
    text: 'Quizzes, assignments, rubrics and a weighted gradebook that feeds transcripts and certificates.',
    points: ['Question bank & quizzes', 'Weighted grading rules', 'Auto-issued certificates'],
  },
  {
    icon: '💳',
    title: 'Payments & Invoicing',
    text: 'Request-to-invoice workflow with verified payment webhooks and automatic access activation.',
    points: ['Custom institutional invoicing', 'Local & international payment rails', 'Reconciliation dashboard'],
  },

  {
    icon: '📊',
    title: 'Reports, Analytics & AI',
    text: 'Role-aware dashboards and phased AI features — recommendations, risk alerts and reporting.',
    points: ['Executive & instructor dashboards', 'At-risk learner indicators', 'Exportable compliance reports'],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="bg-navy-900 py-20 md:py-28 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-lemon-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-lemon-500 font-bold text-[12px] uppercase tracking-wider">
            Our Services
          </span>
          <h2 className="mt-3 text-[30px] md:text-[38px] font-extrabold text-white leading-tight">
            Everything your institution needs, in one platform
          </h2>
          <p className="mt-4 text-[14.5px] text-navy-200">
            Enable only the modules you need today — expand any time as your
            institution grows.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group bg-white/[0.06] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.09] hover:border-lemon-500/40 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-lemon-500/15 flex items-center justify-center text-xl mb-4 group-hover:bg-lemon-500 group-hover:scale-110 transition-all">
                {s.icon}
              </div>
              <h3 className="text-[15.5px] font-extrabold text-white mb-2">{s.title}</h3>
              <p className="text-[13.5px] text-navy-200 leading-relaxed mb-4">{s.text}</p>
              <ul className="space-y-1.5">
                {s.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-[12.5px] text-navy-200">
                    <span className="text-leaf-500 mt-0.5">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}