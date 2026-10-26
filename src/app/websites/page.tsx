import type { Metadata } from 'next'
import { resolveRegion } from '@/lib/region'
import { websiteLaunchEstimate } from '@/lib/credits'
import { WebsitesClient } from './WebsitesClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Instagram page isn’t your business — own your website',
  description: 'Move from a rented social profile to a website you own — found on Google and ChatGPT, taking orders on WhatsApp. Paste your Instagram bio or old site and see your plan free.',
  alternates: { canonical: 'https://wyberai.com/websites' },
  openGraph: {
    title: 'Your Instagram page isn’t your business. Your website is.',
    description: 'Instagram is rented. A website is yours — found on Google and ChatGPT. See the plan for yours, free.',
    url: 'https://wyberai.com/websites',
    type: 'website',
  },
}

export default async function WebsitesPage() {
  const currency = await resolveRegion()
  return <WebsitesClient currency={currency} estimate={websiteLaunchEstimate()} />
}
