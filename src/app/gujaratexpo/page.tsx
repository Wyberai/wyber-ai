import type { Metadata } from 'next'
import { ExpoClient } from './ExpoClient'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const metadata: Metadata = {
  title: 'Build any digital product. Ship it in minutes.',
  description: 'Bring your pain point to the WyberAi booth (S23) at Tech Expo Gujarat. We build it while you watch. Book 15 minutes.',
  openGraph: { images: DEFAULT_OG_IMAGES,
    title: 'Bring your pain point. We will build it live.',
    description: 'Web app, mobile app, website or SaaS, built from plain words. Meet WyberAi at Tech Expo Gujarat, booth S23.',
  },
}

// ?for=software | business | student lets each ad open on the right audience.
export default async function ExpoPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: audience } = await searchParams
  return <ExpoClient initial={audience} />
}
