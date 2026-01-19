"use client"

import React from 'react'
import { LandingNavbar } from './components/navbar'
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from './components/landing-theme-customizer'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'

export function LandingPageContent() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      {/* <main>
        <HeroSection />
        <LogoCarousel />
        <StatsSection />
        <AboutSection />
        <FeaturesSection />
        <TeamSection />
        <PricingSection />
        <TestimonialsSection />
        <BlogSection />
        <FaqSection />
        <CTASection />
        <ContactSection />
      </main> */}

      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
        <h1 className="text-4xl font-bold">Coming Soon</h1>
        <p className="text-lg text-muted-foreground text-balance">We are working hard to bring you the best experience possible.</p>
        <Button variant="outline" size="lg" className="text-base cursor-pointer" onClick={() => router.push('/auth/sign-in')}>
            Get Started Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Footer */}
      {/* <LandingFooter /> */}

      {/* Theme Customizer */}
      <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </div>
  )
}
