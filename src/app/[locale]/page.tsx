import type { Metadata } from 'next'
import { LandingPageContent } from './(public-root)/landing-page-content'

// Metadata for the landing page
export const metadata: Metadata = {
  title: 'Locker',
  description: 'Locker is a platform for learning and development.',
  keywords: ['admin dashboard', 'react', 'nextjs', 'typescript', 'shadcn/ui', 'tailwind css'],
  openGraph: {
    title: 'Locker - Platform for learning and development',
    description: 'Locker is a platform for learning and development.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Locker - Platform for learning and development',
    description: 'Locker is a platform for learning and development.',
  },
}

export default function LocaleRootPage() {
  return <LandingPageContent />
}
