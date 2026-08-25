import { FilePenLine, Handshake, Mail, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AnimateInView } from '../../../shared/components/AnimateInView'

const STEPS: { n: string; title: string; text: string; icon: LucideIcon }[] = [
  {
    n: '01',
    title: 'Tell Us About Your Institution',
    text: 'Fill in the request form below with your institution\u2019s details and the modules you need.',
    icon: FilePenLine,
  },
  {
    n: '02',
    title: 'We Prepare Your Proposal & Invoice',
    text: 'Our team reviews your request and sends a custom invoice straight to your email and phone.',
    icon: Mail,
  },
  {
    n: '03',
    title: 'Confirm Payment & Agreement',
    text: 'Complete payment and sign the service agreement to activate your institution\u2019s account.',
    icon: Handshake,
  },
  {
    n: '04',
    title: 'Get Your Dedicated LMS Link',
    text: 'We provision your own branded subdomain (e.g. aau.brana-lms.com) and email it to you.',
    icon: Rocket,
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-canvas py-20 md:py-28 relative overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 w-[280px] h-[280px] rounded-full bg-lemon-500/5 blur-[90px]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8">
        <AnimateInView className="max-w-2xl mx-auto text-center">
          <span className="marketing-accent-label">How It Works</span>
          <h2 className="mt-3 text-[30px] md:text-[38px] marketing-section-heading">
            From request to a live LMS in four steps
          </h2>
        </AnimateInView>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-[38px] left-[12%] right-[12%] h-[2px] bg-divider" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {STEPS.map((s, index) => {
              const Icon = s.icon
              return (
                <AnimateInView
                  key={s.n}
                  delay={index * 0.1}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="marketing-step-icon relative z-10 w-[76px] h-[76px] rounded-2xl flex items-center justify-center">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <span className="mt-4 marketing-accent-label tracking-widest">STEP {s.n}</span>
                  <h3 className="mt-1.5 text-[15px] font-extrabold marketing-section-heading">{s.title}</h3>
                  <p className="mt-2 text-[13px] marketing-body-text leading-relaxed max-w-[240px]">{s.text}</p>
                </AnimateInView>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
