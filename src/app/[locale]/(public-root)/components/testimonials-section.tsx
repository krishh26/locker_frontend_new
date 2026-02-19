"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Testimonial = {
  name: string
  role: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Learner',
    role: 'Trainee',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1',
    quote:
      'I can keep all my work and evidence in one place and see my progress. My tutor can see everything too—no more lost paperwork.',
  },
  {
    name: 'Centre manager',
    role: 'Training centre',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1',
    quote: 'We use Locker for our learners. It is simple for them to use and we get clear reports on who has completed what.',
  },
  {
    name: 'Assessor',
    role: 'Tutor',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2',
    quote:
      'Reviewing and marking work is straightforward. I can give feedback in one place and learners see it straight away.',
  },
  {
    name: 'Employer',
    role: 'Employer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2',
    quote:
      'We track our team’s learning and qualifications in Locker. Everything is in one place and easy to understand.',
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="container mx-auto px-8 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">What people say</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by learners and centres
          </h2>
          <p className="text-lg text-muted-foreground">
            Learners, tutors, centres and employers use Locker to manage learning and assessments every day.
          </p>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 gap-4 md:columns-2 md:gap-6 lg:columns-3 lg:gap-4">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="mb-6 break-inside-avoid shadow-none lg:mb-4">
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="bg-muted size-12 shrink-0">
                    <AvatarImage
                      alt={testimonial.name}
                      src={testimonial.image}
                      loading="lazy"
                      width="120"
                      height="120"
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <a href="#" onClick={e => e.preventDefault()} className="cursor-pointer">
                      <h3 className="font-medium hover:text-primary transition-colors">{testimonial.name}</h3>
                    </a>
                    <span className="text-muted-foreground block text-sm tracking-wide">
                      {testimonial.role}
                    </span>
                  </div>
                </div>

                <blockquote className="mt-4">
                  <p className="text-sm leading-relaxed text-balance">{testimonial.quote}</p>
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
