import { useRef } from 'react'
import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { AboutSection } from '../components/AboutSection'
import { ServicesSection } from '../components/ServicesSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { RequestServiceForm } from '../components/RequestServiceForm'
import { Footer } from '../components/Footer'

export function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="font-sans">
      <AnnouncementBanner />
      <Navbar onRequestServiceClick={scrollToForm} />
      <Hero onRequestServiceClick={scrollToForm} />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />

      <section id="request-service" ref={formRef} className="bg-canvas pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="text-lemon-700 font-bold text-[12px] uppercase tracking-wider">
              Get Started
            </span>
            <h2 className="mt-3 text-[30px] md:text-[38px] font-extrabold text-navy-900 leading-tight">
              Request Your Institution&rsquo;s LMS
            </h2>
            <p className="mt-3 text-[14.5px] text-secondary-text max-w-lg mx-auto">
              Fill in the form below. Our team will send you a custom
              proposal and invoice, and set up your dedicated Berana LMS
              once payment and the agreement are confirmed.
            </p>
          </div>
          <RequestServiceForm />
        </div>
      </section>

      <Footer />
    </div>
  )
}
