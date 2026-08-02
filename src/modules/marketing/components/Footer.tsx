import logoIcon from '../../../assets/brana-logo-icon.png'

export function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-white/10 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src={logoIcon} alt="Brana LMS" className="h-9 w-auto" />
              <span className="text-white font-extrabold text-lg">
                Brana <span className="text-lemon-500">LMS</span>
              </span>
            </div>
            <p className="mt-4 text-[13px] text-navy-200 max-w-sm leading-relaxed">
              A secure, modular learning management platform by Cyber-Zeb
              Consulting — built for universities, schools, businesses,
              government and NGOs across Ethiopia and beyond.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-[13px] mb-4">Platform</h4>
            <ul className="space-y-2.5 text-[13px] text-navy-200">
              <li><a href="#about" className="hover:text-lemon-500">About</a></li>
              <li><a href="#services" className="hover:text-lemon-500">Services</a></li>
              <li><a href="#how-it-works" className="hover:text-lemon-500">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-[13px] mb-4">Get in Touch</h4>
            <ul className="space-y-2.5 text-[13px] text-navy-200">
              <li>hello@cyberzebconsulting.com</li>
              <li>+251 9xx xxx xxx</li>
              <li>Addis Ababa, Ethiopia</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-navy-200">
            © {new Date().getFullYear()} Cyber-Zeb Consulting. All rights reserved.
          </p>
          <p className="text-[12px] text-navy-200">Brana LMS · Version 1.0</p>
        </div>
      </div>
    </footer>
  )
}