import { useRef } from 'react'

import { AnimateInView } from '../../../shared/components/AnimateInView'
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
    <div className="marketing-page font-sans">
      <Navbar onRequestServiceClick={scrollToForm} />
      <Hero onRequestServiceClick={scrollToForm} />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />

      <section id="request-service" ref={formRef} className="bg-canvas pb-20 md:pb-28 pt-4">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <AnimateInView className="text-center mb-10">
            <span className="marketing-accent-label">Get Started</span>
            <h2 className="mt-3 text-[30px] md:text-[38px] marketing-section-heading">
              Request Your Institution&rsquo;s LMS
            </h2>
            <p className="mt-3 text-[14.5px] marketing-body-text max-w-lg mx-auto">
              Fill in the form below. Our team will send you a custom
              proposal and invoice, and set up your dedicated Brana LMS
              once payment and the agreement are confirmed.
            </p>
          </AnimateInView>
          <AnimateInView delay={0.12}>
            <RequestServiceForm />
          </AnimateInView>
        </div>
      </section>

      <Footer />
    </div>
  )
}
