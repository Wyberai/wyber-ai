import type { Metadata } from 'next'
import { resolveRegion } from '@/lib/region'
import { websiteLaunchEstimate } from '@/lib/credits'
import { WebsitesClient } from './WebsitesClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Get your business found on Google and ChatGPT — AI website builder',
  description: 'Paste your old website or describe your business. WyberAi plans a fast, multi-page site that Google and AI assistants like ChatGPT can actually read — with WhatsApp, maps and your real details. See your plan free.',
  alternates: { canonical: 'https://wyberai.com/websites' },
  openGraph: {
    title: 'Your business, found on Google and ChatGPT',
    description: 'Paste your old website — see the plan for a new one, free. Built for shops, clinics, restaurants, tutors and local services.',
    url: 'https://wyberai.com/websites',
    type: 'website',
  },
}

export default async function WebsitesPage() {
  const currency = await resolveRegion()
  return <WebsitesClient currency={currency} estimate={websiteLaunchEstimate()} />
}
