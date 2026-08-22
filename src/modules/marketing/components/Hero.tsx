import { CheckCircle2 } from 'lucide-react'

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
      className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-[#1c2648] to-navy-700 text-white"
    >
      <div className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-lemon-500/25 blur-[110px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-navy-500/40 blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-lemon-500 text-[11.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-lemon-500 animate-pulse" />
            Cyber-Zeb Consulting
          </span>

          <h1 className="mt-5 text-[36px] leading-[1.1] md:text-[54px] font-extrabold tracking-tight">
            One platform to run your entire
            <span className="text-lemon-500"> institution&rsquo;s learning.</span>
          </h1>

          <p className="mt-5 text-[15.5px] md:text-[17px] text-navy-200 max-w-xl leading-relaxed">
            Brana LMS brings courses, live classes, attendance, assessment,
            payments and parent communication into one secure, modular
            platform — built in Ethiopia for universities, schools,
            businesses, government and NGOs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <button
              onClick={onRequestServiceClick}
              className="bg-lemon-500 text-navy-900 font-bold text-[14px] px-7 py-3.5 rounded-xl hover:bg-lemon-200 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_12px_24px_rgba(168,212,0,0.25)] cursor-pointer"
            >
              Request Your LMS →
            </button>
            <a
              href="#services"
              className="bg-white/10 border border-white/20 text-white font-semibold text-[14px] px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all duration-300"
            >
              Explore Services
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {TRUST_STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-lemon-500">{s.value}</div>
                <div className="text-[11.5px] text-navy-200 uppercase tracking-wide max-w-[160px]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-up hidden lg:block" style={{ animationDelay: '0.15s' }}>
          <div className="relative bg-white/8 border border-white/15 rounded-3xl p-5 backdrop-blur-xl shadow-2xl rotate-[2deg] transition-transform duration-500 hover:rotate-[1deg]">
            <div className="marketing-mockup-surface rounded-2xl p-5 -rotate-[2deg] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1B2340] text-[#A8D400] flex items-center justify-center font-extrabold text-xs">
                    B
                  </div>
                  <span className="text-[#1B2340] font-bold text-[13px]">
                    Addis Ababa University
                  </span>
                </div>
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#F4FBCC] text-[#7A9C00]">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="marketing-mockup-card rounded-xl p-3">
                  <div className="text-[10.5px] text-[#64748B] font-semibold uppercase">
                    Students
                  </div>
                  <div className="text-xl font-extrabold text-[#1B2340]">12,480</div>
                </div>
                <div className="marketing-mockup-card rounded-xl p-3">
                  <div className="text-[10.5px] text-[#64748B] font-semibold uppercase">
                    Live Sessions
                  </div>
                  <div className="text-xl font-extrabold text-[#1B2340]">36 Today</div>
                </div>
                <div className="col-span-2 bg-[#1B2340] rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] text-[#C5CADE] font-semibold uppercase">
                      Completion Rate
                    </div>
                    <div className="text-lg font-extrabold text-white">94.2%</div>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[40, 65, 50, 80, 60, 95].map((h, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-sm bg-[#A8D400] transition-all duration-300"
                        style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute -left-8 bottom-10 marketing-mockup-card rounded-2xl shadow-2xl p-3.5 flex items-center gap-2.5 animate-fade-in-up"
            style={{ animationDelay: '0.35s' }}
          >
            <div className="w-9 h-9 rounded-full bg-[#A8D400] flex items-center justify-center text-[#1B2340]">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#1B2340]">Invoice Sent</div>
              <div className="text-[10.5px] text-[#64748B]">to finance@aau.edu.et</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
