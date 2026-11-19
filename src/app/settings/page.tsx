import type { Metadata } from 'next'
import SettingsClient from './settings-client'
import { resolveRegion } from '@/lib/region'

export const metadata: Metadata = {
  title: { absolute: 'Settings | WyberAi' },
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const currency = await resolveRegion()
  return <SettingsClient isIndia={currency === 'INR'} />
}
