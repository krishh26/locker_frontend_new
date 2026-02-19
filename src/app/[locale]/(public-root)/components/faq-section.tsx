"use client"

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    question: 'What is Locker?',
    answer:
      'Locker is a learning and development platform. It helps learners keep their work and evidence in one place (e-portfolio), complete assessments, and see their progress. Centres and employers can manage learners and courses from one simple place.',
  },
  {
    value: 'item-2',
    question: 'Who is Locker for?',
    answer:
      'Locker is for learners (to build a portfolio and complete assessments), tutors and assessors (to review and mark work), and centres or employers (to manage learning and see reports). You do not need any technical or coding skills to use it.',
  },
  {
    value: 'item-3',
    question: 'How do I sign in?',
    answer:
      'Click “Sign in” at the top of the page or the “Sign in” button on this page. Enter the email and password your centre or organisation gave you. If you have not received login details, contact your centre or use the contact form below.',
  },
  {
    value: 'item-4',
    question: 'How do assessments work?',
    answer:
      'Your tutor or centre will set assessments for you. You complete the work, add any evidence (documents, photos, etc.) in Locker, and submit. Your assessor can then review it, give feedback and record the result. You can see your progress in your dashboard.',
  },
  {
    value: 'item-5',
    question: 'Is my data safe?',
    answer:
      'Yes. We store your data securely and only the right people (e.g. your tutors or centre) can see it. We follow good practice for privacy and keeping your information safe.',
  },
  {
    value: 'item-6',
    question: 'I need help. Who do I contact?',
    answer:
      'If you are a learner, first ask your tutor or centre. For general questions or technical issues, use the Contact section on this page to send us a message. We will get back to you as soon as we can.',
  },
]

const FaqSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Common questions about Locker, signing in and how learning and assessments work. Still have questions? We are here to help.
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <div className='bg-transparent'>
            <div className='p-0'>
              <Accordion type='single' collapsible className='space-y-5'>
                {faqItems.map(item => (
                  <AccordionItem key={item.value} value={item.value} className='rounded-md !border bg-transparent'>
                    <AccordionTrigger className='cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary text-white flex size-9 shrink-0 items-center justify-center rounded-full'>
                          <CircleHelp className='size-5' />
                        </div>
                        <span className='text-start font-semibold'>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-4 bg-transparent'>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We&apos;re here to help.
            </p>
            <Button className='cursor-pointer' asChild>
              <a href="#contact">
                Contact us
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
