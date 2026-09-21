import { useNavigate } from 'react-router-dom'

import { Link } from 'react-router-dom'

import { AnimateInView } from '../../../shared/components/AnimateInView'
import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { AboutSection } from '../components/AboutSection'
import { ServicesSection } from '../components/ServicesSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { Footer } from '../components/Footer'

export function LandingPage() {
  const navigate = useNavigate()

  // Registration now has its own page: the institution fills in its master data
  // and picks its modules there, which is far too much for an inline section.
  function goToRequestPage() {
    navigate('/request')
  }

  return (
    <div className="marketing-page font-sans">
      <AnnouncementBanner />
      <Navbar onRequestServiceClick={goToRequestPage} />
      <Hero onRequestServiceClick={goToRequestPage} />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />

      <section id="request-service" className="bg-canvas pb-20 md:pb-28 pt-4">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <AnimateInView className="text-center">
            <span className="marketing-accent-label">Get Started</span>
            <h2 className="mt-3 text-[30px] md:text-[38px] marketing-section-heading">
              Request Your Institution&rsquo;s LMS
            </h2>
            <p className="mt-3 text-[14.5px] marketing-body-text max-w-lg mx-auto">
              Register your institution, tell us about it and choose the modules you need.
              Our team sends a proposal and invoice, then activates your dedicated Brana LMS
              once payment and the agreement are confirmed.
            </p>
            <Link
              to="/request"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lemon-500 px-7 py-3 text-[14px] font-bold text-[#020810] hover:bg-lemon-400 transition-colors"
            >
              Register your institution →
            </Link>
          </AnimateInView>
        </div>
      </section>

      <Footer />
    </div>
  )
}
