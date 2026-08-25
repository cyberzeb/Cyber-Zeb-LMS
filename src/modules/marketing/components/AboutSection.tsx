import { Globe2, Lock, Puzzle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AnimateInView } from '../../../shared/components/AnimateInView'

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
    text: 'Designed with low-bandwidth environments and local payment rails without limiting global reach.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-canvas py-20 md:py-28 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 w-[320px] h-[320px] rounded-full bg-lemon-500/5 blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <AnimateInView className="lg:col-span-5">
            <span className="marketing-accent-label">About Us</span>
            <h2 className="mt-3 text-[30px] md:text-[38px] marketing-section-heading">
              We&rsquo;re Cyber-Zeb Consulting — and Brana LMS is how we bring
              modern learning technology home.
            </h2>
            <p className="mt-5 text-[15px] marketing-body-text leading-relaxed">
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
          </AnimateInView>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PRINCIPLES.map((p, index) => {
              const Icon = p.icon
              return (
                <AnimateInView key={p.title} delay={index * 0.1}>
                  <div className="marketing-feature-card group h-full">
                    <div className="marketing-icon-chip w-11 h-11 mb-4">
                      <Icon size={22} strokeWidth={2.25} />
                    </div>
                    <h3 className="text-[15px] font-extrabold marketing-section-heading mb-2">{p.title}</h3>
                    <p className="text-[13.5px] marketing-body-text leading-relaxed">{p.text}</p>
                  </div>
                </AnimateInView>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
