import type { Metadata } from 'next'
import { resolveRegion } from '@/lib/region'
import { websiteLaunchEstimate } from '@/lib/credits'
import { WebsitesClient } from './WebsitesClient'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Own your website, not just an Instagram page',
  description: 'Move from a rented social profile to a website you own, found on Google and ChatGPT and taking orders on WhatsApp. See your plan free.',
  alternates: { canonical: 'https://wyberai.com/websites' },
  openGraph: { images: DEFAULT_OG_IMAGES,
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
