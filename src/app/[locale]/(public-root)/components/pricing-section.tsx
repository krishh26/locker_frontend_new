"use client"

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'Learners',
    description: 'For individual learners using Locker',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Your own e-portfolio',
      'Add evidence and track progress',
      'Complete assessments and get feedback',
      'See your results in one place'
    ],
    cta: 'Sign in',
    popular: false
  },
  {
    name: 'Centres & employers',
    description: 'For training centres and employers',
    monthlyPrice: -1,
    yearlyPrice: -1,
    features: [
      'Manage learners and courses',
      'Set and run assessments',
      'View reports and progress',
      'Support for tutors and assessors'
    ],
    cta: 'Contact for pricing',
    popular: true,
    includesPrevious: undefined
  },
  {
    name: 'Custom',
    description: 'Tailored for your organisation',
    monthlyPrice: -1,
    yearlyPrice: -1,
    features: [
      'Everything in Centres & employers',
      'Custom setup and training',
      'Dedicated support',
      'Fits your processes'
    ],
    cta: 'Contact us',
    popular: false,
    includesPrevious: undefined
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple options for everyone
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Learners can use Locker for free. Centres and employers—contact us for pricing that fits your organisation.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border">
            <div className="grid lg:grid-cols-3">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`p-8 grid grid-rows-subgrid row-span-4 gap-6 ${
                    plan.popular
                      ? 'my-2 mx-4 rounded-xl bg-card border-transparent shadow-xl ring-1 ring-foreground/10 backdrop-blur'
                      : ''
                  }`}
                >
                  {/* Plan Header */}
                  <div>
                    <div className="text-lg font-medium tracking-tight mb-2">{plan.name}</div>
                    <div className="text-muted-foreground text-balance text-sm">{plan.description}</div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      {plan.monthlyPrice === -1 ? (
                        'Contact us'
                      ) : plan.monthlyPrice === 0 ? (
                        'Free'
                      ) : (
                        `$${plan.monthlyPrice}`
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {plan.monthlyPrice === -1 ? 'We will get in touch' : 'For learners'}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Button
                      className={`w-full cursor-pointer my-2 ${
                        plan.popular
                          ? 'shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary ring-1 ring-primary text-primary-foreground hover:bg-primary/90'
                          : 'shadow-sm shadow-black/15 border border-transparent bg-background ring-1 ring-foreground/10 hover:bg-muted text-black'
                      }`}
                      variant={plan.popular ? 'default' : 'secondary'}
                      asChild
                    >
                      <a href={plan.cta === 'Sign in' ? '/auth/sign-in' : '#contact'}>{plan.cta}</a>
                    </Button>
                  </div>

                  {/* Features */}
                  <div>
                    <ul role="list" className="space-y-3 text-sm">
                      {plan.includesPrevious && (
                        <li className="flex items-center gap-3 font-medium">
                          {plan.includesPrevious}
                        </li>
                      )}
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-4 shrink-0" strokeWidth={2.5} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Have questions about pricing? {' '}
            <Button variant="link" className="p-0 h-auto cursor-pointer" asChild>
              <a href="#contact">
                Contact us
              </a>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
