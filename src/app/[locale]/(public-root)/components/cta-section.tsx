"use client"

import { ArrowRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className='py-16 lg:py-24 bg-muted/80'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <div className='space-y-8'>
              <div className='flex flex-col items-center gap-4'>
                <Badge variant='outline' className='flex items-center gap-2'>
                  <TrendingUp className='size-3' />
                  Get started
                </Badge>

                <div className='text-muted-foreground flex items-center gap-4 text-sm flex-wrap justify-center'>
                  <span className='flex items-center gap-1'>
                    <div className='size-2 rounded-full bg-accent' />
                    Secure
                  </span>
                  <Separator orientation='vertical' className='h-4!' />
                  <span>For centres and employers</span>
                  <Separator orientation='vertical' className='h-4!' />
                  <span>Track progress</span>
                </div>
              </div>

              <div className='space-y-6'>
                <h1 className='text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
                  Start managing learning and
                  <span className='flex sm:inline-flex justify-center'>
                    <span className='relative mx-2'>
                      <span className='bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent'>
                        assessments
                      </span>
                      <div className='absolute start-0 -bottom-2 h-1 w-full bg-linear-to-r from-primary/30 to-secondary/30' />
                    </span>
                    today
                  </span>
                </h1>

                <p className='text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl'>
                  Sign in to your account and access your e-portfolio, assessments and progress. No technical knowledge needed.
                </p>
              </div>

              <div className='flex flex-col justify-center gap-4 sm:flex-row sm:gap-6'>
                <Button size='lg' className='cursor-pointer px-8 py-6 text-lg font-medium' asChild>
                  <Link href='/auth/sign-in'>
                    Sign in
                    <ArrowRight className='ms-2 size-4' />
                  </Link>
                </Button>
              </div>

              <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='size-2 rounded-full bg-accent me-1' />
                  <span>Secure</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='size-2 rounded-full bg-primary me-1' />
                  <span>For centres and employers</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='size-2 rounded-full bg-purple-600 dark:bg-purple-400 me-1' />
                  <span>Track progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
