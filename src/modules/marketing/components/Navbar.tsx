import { useState } from 'react'
import brandLogo from '../../../assets/Logo.jpg'

interface NavbarProps {
  onRequestServiceClick: () => void
}

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#request-service' },
]

export function Navbar({ onRequestServiceClick }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <img src={brandLogo} alt="Berana LMS" className="h-10 w-auto rounded-lg object-contain" />
          <span className="text-white font-extrabold text-lg tracking-tight">
            Berana <span className="text-lemon-500">LMS</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13.5px] font-semibold text-navy-200 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-[12px] font-semibold text-navy-200">
            A Cyber-Zeb Consulting product
          </span>
          <button
            onClick={onRequestServiceClick}
            className="bg-lemon-500 text-navy-900 font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-lemon-200 transition-colors cursor-pointer"
          >
            Request Service
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-navy-900 border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[14px] font-semibold text-navy-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => {
              setOpen(false)
              onRequestServiceClick()
            }}
            className="bg-lemon-500 text-navy-900 font-bold text-[13.5px] px-5 py-3 rounded-lg cursor-pointer"
          >
            Request Service
          </button>
        </div>
      )}
    </header>
  )
}
