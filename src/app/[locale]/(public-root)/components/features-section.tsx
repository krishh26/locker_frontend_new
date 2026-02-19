"use client"

import {
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  Database,
  Package,
  Crown,
  Layout,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image3D } from '@/components/image-3d'
import Link from 'next/link'

const mainFeatures = [
  {
    icon: Package,
    title: 'E-portfolio',
    description: 'Keep all your work, evidence and achievements in one place that you can access anytime.'
  },
  {
    icon: Crown,
    title: 'Assessments',
    description: 'Complete assessments and get feedback from your tutors in a clear, simple way.'
  },
  {
    icon: Layout,
    title: 'Progress tracking',
    description: 'See how you are doing and what is left to complete—no guesswork.'
  },
  {
    icon: Zap,
    title: 'Evidence and documents',
    description: 'Add documents, photos or other evidence to show what you have learned.'
  }
]

const secondaryFeatures = [
  {
    icon: BarChart3,
    title: 'Reports',
    description: 'View reports on progress and completion for learners and centres.'
  },
  {
    icon: Palette,
    title: 'For centres and employers',
    description: 'Manage learners, courses and assessments from one place.'
  },
  {
    icon: Users,
    title: 'Tutor and assessor tools',
    description: 'Review work, give feedback and mark assessments easily.'
  },
  {
    icon: Database,
    title: 'Safe and secure',
    description: 'Your data is stored securely and only the right people can see it.'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">What Locker offers</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need for learning and assessment
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you are a learner, a tutor or a centre—Locker helps you manage learning, evidence and assessments in one simple platform.
          </p>
        </div>

        {/* First Feature Section */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Left Image */}
          <Image3D
            lightSrc="/feature-1.png"
            darkSrc="/feature-1-dark.png"
            alt="Analytics dashboard"
            direction="left"
          />
          {/* Right Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Built for how you learn and assess
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Locker brings together your e-portfolio, assessments and progress in one place. Add evidence, get feedback and see your journey clearly.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {mainFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium text-balance">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <Link href="/auth/sign-in" className='flex items-center'>
                  Sign in
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                <Link href="#pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Second Feature Section - Flipped Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Simple for everyone—no technical skills needed
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Locker is easy to use. Learners can add evidence and track progress; tutors can review and assess; centres can manage courses and reports—all in plain language.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {secondaryFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium text-balance">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <Link href="/auth/sign-in" className='flex items-center'>
                  Get started
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                <Link href="#contact">Contact us</Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <Image3D
            lightSrc="/feature-1.png"
            darkSrc="/feature-1-dark.png"
            alt="Performance dashboard"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>
      </div>
    </section>
  )
}
