import { Globe2, Lock, Puzzle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Lock,
    title: 'Secure by Design',
    text: 'Authentication, role-based authorization, encryption and audit logging are built into every module — not bolted on.',
  },
  {
    icon: Puzzle,
    title: 'Modular & Multi-Tenant',
    text: 'Enable only the modules your institution needs. Your data, branding and users always stay isolated from other tenants.',
  },
  {
    icon: Globe2,
    title: 'Built for Ethiopia, Ready for the World',
    text: 'Designed with low-bandwidth environments, local payment rails without limiting global reach.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-canvas py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 animate-fade-in-up">
            <span className="text-lemon-700 font-bold text-[12px] uppercase tracking-wider">
              About Us
            </span>
            <h2 className="mt-3 text-[30px] md:text-[38px] font-extrabold text-navy-900 leading-tight">
              We&rsquo;re Cyber-Zeb Consulting — and Brana LMS is how we bring
              modern learning technology home.
            </h2>
            <p className="mt-5 text-[15px] text-secondary-text leading-relaxed">
              Brana LMS is a secure, modular, integration-ready learning
              platform built to help universities, schools, businesses,
              government institutions and NGOs manage learners, instructors,
              parents, courses, live classes, payments and reporting — all
              from one controlled system. We designed it API-first and
              multi-tenant from day one, so every institution we onboard gets
              its own isolated, branded workspace on a platform that keeps
              improving for everyone.
            </p>
            <a
              href="#request-service"
              className="mt-7 inline-flex items-center gap-2 text-navy-900 font-bold text-[14px] border-b-2 border-lemon-500 pb-1 hover:gap-3 transition-all duration-300"
            >
              Start your institution&rsquo;s journey →
            </a>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PRINCIPLES.map((p, index) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className="marketing-feature-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-lemon-50 flex items-center justify-center text-lemon-700 mb-4 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={22} strokeWidth={2.25} />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-navy-900 mb-2">
                    {p.title}
                  </h3>
                  <p className="text-[13.5px] text-secondary-text leading-relaxed">
                    {p.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
