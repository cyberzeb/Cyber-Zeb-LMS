import { Link } from 'react-router-dom'

import { CheckCircle2 } from 'lucide-react'

import { AnimateInView } from '../../../shared/components/AnimateInView'

interface HeroProps {
  onRequestServiceClick: () => void
}

const TRUST_STATS = [
  { value: '20+', label: 'Platform Modules' },
  { value: '99.9%', label: 'Target Uptime' },
  { value: 'ET', label: 'Built for Ethiopia, ready for the world' },
]

export function Hero({ onRequestServiceClick }: HeroProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-[#1B2340] via-[#1c2648] to-[#243056] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'linear-gradient(120deg, rgba(168,212,0,0.08) 0%, transparent 40%, rgba(74,85,128,0.15) 100%)',
          backgroundSize: '200% 200%',
          animation: 'marketingShimmer 12s ease infinite',
        }}
      />
      <div className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-lemon-500/20 blur-[110px] marketing-hero-glow" />
      <div className="pointer-events-none absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-navy-500/30 blur-[110px] marketing-hero-glow" style={{ animationDelay: '2s' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="marketing-hero-badge inline-flex items-center gap-2 bg-white/10 border border-white/15 text-lemon-500 text-[11.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-lemon-500 animate-pulse" />
            Cyber-Zeb Consulting
          </span>

          <h1 className="marketing-hero-title mt-5 text-[36px] leading-[1.1] md:text-[54px] font-extrabold tracking-tight">
            One platform to run your entire
            <span className="text-lemon-500"> institution&rsquo;s learning.</span>
          </h1>

          <p className="marketing-hero-copy mt-5 text-[15.5px] md:text-[17px] text-[#C5CADE] max-w-xl leading-relaxed">
            Brana LMS brings courses, live classes, attendance, assessment,
            payments and parent communication into one secure, modular
            platform — built in Ethiopia for universities, schools,
            businesses, government and NGOs.
          </p>

          <div className="marketing-hero-actions mt-8 flex flex-wrap gap-3.5">
            <button
              onClick={onRequestServiceClick}
              className="marketing-btn-primary bg-lemon-500 text-[#020810] font-bold text-[14px] px-7 py-3.5 rounded-xl hover:bg-lemon-200 cursor-pointer shadow-[0_12px_24px_rgba(168,212,0,0.25)]"
            >
              Request Your LMS →
            </button>
            <Link
              to="/login"
              className="marketing-btn-ghost bg-white/10 border border-white/20 text-white font-semibold text-[14px] px-7 py-3.5 rounded-xl hover:bg-white/15"
            >
              Sign in to your portal
            </Link>
          </div>

          <div className="marketing-hero-stats mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {TRUST_STATS.map((s, i) => (
              <AnimateInView key={s.label} delay={0.4 + i * 0.08} className="min-w-[120px]">
                <div className="text-2xl font-extrabold text-lemon-500">{s.value}</div>
                <div className="text-[11.5px] text-[#C5CADE] uppercase tracking-wide max-w-[160px]">
                  {s.label}
                </div>
              </AnimateInView>
            ))}
          </div>
        </div>

        <div className="relative marketing-hero-mockup hidden lg:block">
          <div className="relative marketing-hero-mockup-wrap bg-white/8 border border-white/15 rounded-3xl p-5 backdrop-blur-xl shadow-2xl rotate-[2deg] transition-transform duration-500 hover:rotate-[1deg]">
            <div className="marketing-mockup-surface rounded-2xl p-5 -rotate-[2deg] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1B2340] text-[#A8D400] flex items-center justify-center font-extrabold text-xs">
                    B
                  </div>
                  <span className="text-[#1B2340] font-bold text-[13px] dark:text-[#f1f5f9]">
                    Addis Ababa University
                  </span>
                </div>
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#F4FBCC] text-[#7A9C00] dark:bg-lemon-500/15 dark:text-lemon-500">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="marketing-mockup-card rounded-xl p-3">
                  <div className="text-[10.5px] text-[#64748B] font-semibold uppercase">Students</div>
                  <div className="text-xl font-extrabold text-[#1B2340] dark:text-[#f1f5f9]">12,480</div>
                </div>
                <div className="marketing-mockup-card rounded-xl p-3">
                  <div className="text-[10.5px] text-[#64748B] font-semibold uppercase">Live Sessions</div>
                  <div className="text-xl font-extrabold text-[#1B2340] dark:text-[#f1f5f9]">36 Today</div>
                </div>
                <div className="col-span-2 bg-[#1B2340] rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] text-[#C5CADE] font-semibold uppercase">Completion Rate</div>
                    <div className="text-lg font-extrabold text-white">94.2%</div>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[40, 65, 50, 80, 60, 95].map((h, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-sm bg-[#A8D400] marketing-chart-bar"
                        style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.08}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimateInView
            delay={0.55}
            className="absolute -left-8 bottom-10 marketing-mockup-card rounded-2xl shadow-2xl p-3.5 flex items-center gap-2.5 marketing-hero-float"
          >
            <div className="w-9 h-9 rounded-full bg-[#A8D400] flex items-center justify-center text-[#1B2340]">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#1B2340] dark:text-[#f1f5f9]">Invoice Sent</div>
              <div className="text-[10.5px] text-[#64748B]">to finance@aau.edu.et</div>
            </div>
          </AnimateInView>
        </div>
      </div>
    </section>
  )
}
