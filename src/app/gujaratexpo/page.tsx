import type { Metadata } from 'next'
import { ExpoClient } from './ExpoClient'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const metadata: Metadata = {
  title: 'Build any digital product. Ship it in minutes.',
  description: 'Most software has 100 features and you use 5. Tell us what you need and we build it live at the WyberAi booth (S23), Tech Expo Gujarat. Book 15 minutes.',
  openGraph: { images: DEFAULT_OG_IMAGES,
    title: 'Bring your pain point. We will build it live.',
    description: 'Most software has 100 features and you use 5. Web app, website, mobile app, SaaS, or your own version of a tool you pay for, built from plain words. Meet WyberAi at Tech Expo Gujarat, booth S23.',
  },
}

// ?for=software | business | student lets each ad open on the right audience.
export default async function ExpoPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: audience } = await searchParams
  return <ExpoClient initial={audience} />
}
