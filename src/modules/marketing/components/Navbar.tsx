import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import brandLogo from '../../../assets/Logo.jpg'

import { portalPathForRole } from '../../../shared/auth/portalRoutes'

import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import type { TranslationKey } from '../../../shared/i18n/translations'
import { getSessionPerson, readPortalSession } from '../../../shared/storage/session'



interface NavbarProps {

  onRequestServiceClick: () => void

}



const NAV_LINKS: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: 'nav.about', href: '#about' },
  { labelKey: 'nav.services', href: '#services' },
  { labelKey: 'nav.howItWorks', href: '#how-it-works' },
  { labelKey: 'nav.contact', href: '#request-service' },
]



export function Navbar({ onRequestServiceClick }: NavbarProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const [scrolled, setScrolled] = useState(false)

  const session = readPortalSession()
  const person = getSessionPerson()
  const signedIn = Boolean(session && person)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (

    <header

      className={`marketing-nav sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${

        scrolled

          ? 'marketing-nav-scrolled bg-[#1B2340]/95 dark:bg-[#020810]/95'

          : 'bg-[#1B2340]/80 dark:bg-[#020810]/80 border-white/10'

      }`}

    >

      <div className="max-w-7xl mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">

        <a href="#top" className="flex items-center gap-2.5 group">

          <img

            src={brandLogo}

            alt="Brana LMS"

            className="h-10 w-auto rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"

          />

          <span className="text-white font-extrabold text-lg tracking-tight">

            Brana <span className="text-lemon-500">LMS</span>

          </span>

        </a>



        <nav className="hidden md:flex items-center gap-8">

          {NAV_LINKS.map((link) => (

            <a

              key={link.labelKey}

              href={link.href}

              className="text-[13.5px] font-semibold text-navy-200 hover:text-white transition-colors duration-200 relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-lemon-500 after:transition-all after:duration-300 hover:after:w-full"

            >

              {t(link.labelKey)}

            </a>

          ))}

        </nav>



        <div className="hidden lg:flex items-center gap-3">

          <span className="text-[11px] font-semibold text-navy-300 mr-1">

            A Cyber-Zeb Consulting product

          </span>

          {signedIn && session ? (

            <Link

              to={portalPathForRole(session.role)}

              className="border border-white/20 text-white font-semibold text-[12px] px-4 py-2 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200 whitespace-nowrap"

            >

              {t('nav.myPortal')}

            </Link>

          ) : null}

          <Link

            to="/login"

            className="bg-lemon-500 text-navy-900 font-bold text-[12px] px-5 py-2 rounded-lg hover:bg-lemon-200 transition-all duration-200 whitespace-nowrap"

          >

            {signedIn ? t('nav.switchAccount') : t('nav.signIn')}

          </Link>

          <LanguageSwitcher variant="marketing" />

          <ThemeToggle variant="marketing" />

          <button

            onClick={onRequestServiceClick}

            className="marketing-btn-primary border border-white/20 text-white font-semibold text-[12px] px-4 py-2 rounded-lg hover:bg-white/10 cursor-pointer whitespace-nowrap"

          >

            {t('nav.requestService')}

          </button>

        </div>



        <button

          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"

          onClick={() => setOpen((v) => !v)}

          aria-label={t('nav.toggleMenu')}

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



      <div

        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${

          open ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'

        }`}

      >

        <div className="border-t border-white/10 px-6 py-4 flex flex-col gap-4 bg-[#1B2340] dark:bg-[#020810]">

          {NAV_LINKS.map((link) => (

            <a

              key={link.labelKey}

              href={link.href}

              onClick={() => setOpen(false)}

              className="text-[14px] font-semibold text-navy-200 hover:text-white transition-colors"

            >

              {t(link.labelKey)}

            </a>

          ))}

          {signedIn && session ? (

            <Link

              to={portalPathForRole(session.role)}

              onClick={() => setOpen(false)}

              className="border border-white/20 text-white font-semibold text-[13.5px] px-5 py-3 rounded-lg text-center hover:bg-white/10 transition-colors"

            >

              {t('nav.myPortal')}

            </Link>

          ) : null}

          <Link

            to="/login"

            onClick={() => setOpen(false)}

            className="marketing-btn-primary bg-lemon-500 text-navy-900 font-bold text-[13.5px] px-5 py-3 rounded-lg text-center"

          >

            {signedIn ? t('nav.switchAccount') : t('nav.signIn')}

          </Link>

          <div className="flex justify-center gap-2">
            <LanguageSwitcher variant="marketing" />
            <ThemeToggle variant="marketing" />
          </div>

          <button

            onClick={() => {

              setOpen(false)

              onRequestServiceClick()

            }}

            className="border border-white/20 text-white font-semibold text-[13.5px] px-5 py-3 rounded-lg cursor-pointer"

          >

            {t('nav.requestService')}

          </button>

        </div>

      </div>

    </header>

  )

}


