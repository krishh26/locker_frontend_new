"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Users, Shield, BookOpen, Heart } from 'lucide-react'

const values = [
  {
    icon: Users,
    title: 'Learner-focused',
    description: 'Everything is designed so learners can easily add evidence, see progress and complete assessments.'
  },
  {
    icon: BookOpen,
    title: 'Assessor-friendly',
    description: 'Tutors and assessors can review work, give feedback and mark assessments without extra complexity.'
  },
  {
    icon: Shield,
    title: 'Safe and compliant',
    description: 'Your data is stored securely and we follow good practice for privacy and compliance.'
  },
  {
    icon: Heart,
    title: 'Built for the learning community',
    description: 'Locker is made to support real learning journeys—for centres, employers and learners alike.'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            About Locker
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Built for learners, by learners
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            We believe learning and assessment should be simple for everyone. Locker helps learners show what they know, and helps centres and employers manage it all in one place.
          </p>
        </div>

        {/* Modern Values Grid with Enhanced Design */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {values.map((value, index) => (
            <Card key={index} className='group shadow-xs py-2'>
              <CardContent className='p-8'>
                <div className='flex flex-col items-center text-center'>
                  <CardDecorator>
                    <value.icon className='h-6 w-6' aria-hidden />
                  </CardDecorator>
                  <h3 className='mt-6 font-medium text-balance'>{value.title}</h3>
                  <p className='text-muted-foreground mt-3 text-sm'>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">❤️ Made with love for the learner community</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          </div>
        </div>
      </div>
    </section>
  )
}
