import { ChangePasswordForm } from './components/change-password-form'
import Image from 'next/image'
import Link from 'next/link'

export default function ChangePasswordPage() {
  return (
    <div className='flex min-h-svh flex-col bg-muted/40'>
      {/* Branding at top center */}
      <div className='flex justify-center pt-8'>
        <Link
          href='/'
          className='flex items-center gap-2 font-medium cursor-pointer'
        >
          <Image
            src='/logo-text.png'
            alt='Locker'
            width={100}
            height={100}
            className='h-8 w-auto'
          />
        </Link>
      </div>

      {/* Centered form card */}
      <div className='flex flex-1 items-center justify-center p-6'>
        <div className='w-full max-w-md'>
          <div className='bg-card rounded-lg border shadow-sm p-8'>
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      {/* Legal disclaimer at bottom */}
      <div className='flex justify-center pb-8'>
        <p className='text-muted-foreground text-xs text-center'>
          By continuing, you agree to our{' '}
          <Link
            href='/terms'
            className='underline underline-offset-4 hover:text-foreground'
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href='/privacy'
            className='underline underline-offset-4 hover:text-foreground'
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
