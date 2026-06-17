import { LoginForm } from './components/login-form'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className='relative min-h-svh w-full'>
      <Image
        src='/online-eduction-v1.jpg'
        alt='Online education'
        fill
        priority
        className='object-cover'
      />
      <div className='absolute inset-0 bg-black/25' />

      <div className='relative z-10 min-h-svh'>
        <div className='absolute top-0 left-0 p-6 md:p-10'>
          <Link
            href='/'
            className='flex items-center gap-2 font-medium cursor-pointer'
          >
            <Image
              src='/logo-text.png'
              alt='Locker'
              width={100}
              height={100}
              className='h-14 w-auto'
            />
          </Link>
        </div>

        <div className='flex min-h-svh items-center justify-center p-6'>
          <div className='w-full max-w-md rounded-xl border bg-background/95 p-6 shadow-lg backdrop-blur-sm md:p-8'>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
