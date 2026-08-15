import type { Metadata } from 'next'
import { IndependenceDayChallenge } from './IndependenceDayChallenge'

export const metadata: Metadata = {
  title: 'Independence Day Startup Challenge — Win ₹1 Lakh',
  description: "Build an MVP on WyberAi today and win ₹1,00,000 cash. India's biggest one-day startup challenge. Free to enter. August 15th only.",
  openGraph: {
    title: 'Build India\'s Next Startup. Win ₹1 Lakh.',
    description: 'Build any working app on WyberAi on August 15th. The best build wins ₹1,00,000 cash. Free account is enough. One day. One lakh.',
    url: 'https://wyberai.com/independence-day',
    images: [{ url: 'https://wyberai.com/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build India\'s Next Startup. Win ₹1 Lakh.',
    description: 'Independence Day Startup Challenge. Build an MVP on WyberAi on August 15th. Best build wins ₹1,00,000 cash. Free to enter.',
  },
}

export default function Page() {
  return <IndependenceDayChallenge />
}
