import { headers } from 'next/headers'
import { resolveRegion, isOwnerPreview } from '@/lib/region'
import { resolveHeroSegment } from '@/lib/hero-segments'
import { HomeClient } from './HomeClient'
import { OwnerRegionSwitcher } from '@/components/shared/OwnerRegionSwitcher'
import { getScanStats } from '@/lib/security-stats'
import { getAppsBuiltCount, formatAppsBuiltStat } from '@/lib/apps-built-stats'
import { getTopGalleryApps, getFeaturedUserBuilds } from '@/lib/homepage-gallery'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India. The
// owner switcher only renders on a browser unlocked via /api/owner-preview.
//
// Edge runtime so this (unavoidably dynamic) function executes at the PoP
// nearest the visitor instead of always round-tripping to a single Node
// region — that extra hop was the main source of slow "live" page loads.
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const currency = await resolveRegion()
  const owner = await isOwnerPreview()
  const stats = await getScanStats()
  const appsBuiltCount = await getAppsBuiltCount()
  const appsBuiltStat = appsBuiltCount !== null ? formatAppsBuiltStat(appsBuiltCount) : null
  const galleryApps = await getTopGalleryApps(8)
  const userBuilds = await getFeaturedUserBuilds(6)
  // Adaptive hero: segment resolved from utm/referer on this same per-request
  // render — untagged traffic resolves to null and gets the default copy.
  // NEXT_PUBLIC_ADAPTIVE_HERO=0 is the kill switch.
  let segment = null
  if (process.env.NEXT_PUBLIC_ADAPTIVE_HERO !== '0') {
    const params = await searchParams
    const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
    segment = resolveHeroSegment({
      utmSource: one(params.utm_source),
      utmCampaign: one(params.utm_campaign),
      referer: (await headers()).get('referer'),
    })
  }
  return (
    <>
      <HomeClient initialCurrency={currency} scanStats={stats} initialSegment={segment} appsBuiltStat={appsBuiltStat} galleryApps={galleryApps} userBuilds={userBuilds} />
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  )
}
