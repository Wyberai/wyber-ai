import type { Metadata } from 'next'
import { ExpoClient } from './ExpoClient'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const metadata: Metadata = {
  title: "Vibe coding doesn't have to be boring or vulnerable.",
  description: 'Websites, web apps, mobile apps, SaaS, or your own version of a SaaS you rent. Plus superpowers: it tests your database, locks out exposed keys, makes your site readable to Google and AI, and flags the made-by-AI look. Build it live at the WyberAi booth (S23), Tech Expo Gujarat. Book 15 minutes.',
  openGraph: { images: DEFAULT_OG_IMAGES,
    title: "Vibe coding doesn't have to be boring or vulnerable.",
    description: 'Own your software, stop renting it. Web app, website, mobile app or SaaS from plain words, with the checks vibe coding skips. Meet WyberAi at Tech Expo Gujarat, booth S23.',
  },
}

// ?for=software | business | student lets each ad open on the right audience.
export default async function ExpoPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: audience } = await searchParams
  return <ExpoClient initial={audience} />
}
