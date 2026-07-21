import SettingsClient from './settings-client'
import { resolveRegion } from '@/lib/region'

export default async function SettingsPage() {
  const currency = await resolveRegion()
  return <SettingsClient isIndia={currency === 'INR'} />
}
