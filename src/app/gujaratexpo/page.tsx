import type { Metadata } from 'next'
import { ExpoClient } from './ExpoClient'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const metadata: Metadata = {
  title: 'Vibe coding with superpowers.',
  description: 'Vibe coding gives you a base. WyberAi gives you the whole app: an AI agent that plans, builds, repairs and checks it. Websites, web apps, mobile apps, SaaS, or your own version of a SaaS you rent. It tests your database, locks out exposed keys, makes your site readable to Google and AI, and flags the made-by-AI look. Build it live at the WyberAi booth (S23), Tech Expo Gujarat. Book 15 minutes.',
  openGraph: { images: DEFAULT_OG_IMAGES,
    title: 'Vibe coding with superpowers.',
    description: 'Own your software, stop renting it. Web app, website, mobile app or SaaS from plain words, with the checks vibe coding skips. Meet WyberAi at Tech Expo Gujarat, booth S23.',
  },
}

// ?for=software | business | student lets each ad open on the right audience.
export default async function ExpoPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: audience } = await searchParams
  return <ExpoClient initial={audience} />
}
