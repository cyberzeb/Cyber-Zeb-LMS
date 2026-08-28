const STEPS = [
  {
    n: '01',
    title: 'Tell Us About Your Institution',
    text: 'Fill in the request form below with your institution\u2019s details and the modules you need.',
    icon: '📝',
  },
  {
    n: '02',
    title: 'We Prepare Your Proposal & Invoice',
    text: 'Our team reviews your request and sends a custom invoice straight to your email and phone.',
    icon: '📧',
  },
  {
    n: '03',
    title: 'Confirm Payment & Agreement',
    text: 'Complete payment and sign the service agreement to activate your institution\u2019s account.',
    icon: '🤝',
  },
  {
    n: '04',
    title: 'Get Your Dedicated LMS Link',
    text: 'We provision your own branded subdomain (e.g. aau.berana-lms.com) and email it to you.',
    icon: '🚀',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-canvas py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-lemon-700 font-bold text-[12px] uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="mt-3 text-[30px] md:text-[38px] font-extrabold text-navy-900 leading-tight">
            From request to a live LMS in four steps
          </h2>
        </div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-[38px] left-0 right-0 h-[2px] bg-divider" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {STEPS.map((s) => (
              <div key={s.n} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-[76px] h-[76px] rounded-2xl bg-navy-900 flex items-center justify-center text-2xl shadow-[0_10px_24px_rgba(27,35,64,0.25)]">
                  {s.icon}
                </div>
                <span className="mt-4 text-lemon-700 font-extrabold text-[12px] tracking-widest">
                  STEP {s.n}
                </span>
                <h3 className="mt-1.5 text-[15px] font-extrabold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-[13px] text-secondary-text leading-relaxed max-w-[240px]">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
