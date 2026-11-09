import { headers, cookies } from 'next/headers'
import { DOOR_COOKIE, parseDoorCookie } from '@/lib/intent/persona'
import { resolveRegion, isOwnerPreview } from '@/lib/region'
import { resolveHeroSegment } from '@/lib/hero-segments'
import { buildPrior } from '@/lib/intent/prior'
import { intentExperimentOn, decodeXp, XP_COOKIE } from '@/lib/intent/experiment'
import { HomeClient } from './HomeClient'
import { HomeSwitch } from '@/components/signal/HomeSwitch'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { SignalHome } from '@/components/signal/SignalHome'
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
  // Visitor-intent experiment: India-only and off unless NEXT_PUBLIC_INTENT_EXPERIMENT=1.
  // A null prior means HomeClient renders exactly what it always has.
  let intentPrior = null
  let initialDoor: ReturnType<typeof parseDoorCookie> = null
  let initialAsking = false
  // The owner (a browser unlocked via /api/owner-preview) always gets it on the India view, so it can be tried live
  // before it is switched on for the public.
  // Off for everyone, the owner included, unless the flag is set. (Earlier the owner's browser always got it.)
  if (intentExperimentOn(process.env.NEXT_PUBLIC_INTENT_EXPERIMENT) && currency === 'INR') {
    const params = await searchParams
    const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
    const h = await headers()
    intentPrior = buildPrior({
      path: '/',
      utmSource: one(params.utm_source),
      utmCampaign: one(params.utm_campaign),
      utmContent: one(params.utm_content),
      forParam: one(params.for),
      referer: h.get('referer'),
      country: h.get('x-vercel-ip-country'),
      region: h.get('x-vercel-ip-country-region'),
      acceptLanguage: h.get('accept-language'),
    })
    // Decide on the server what the very first paint shows, so nobody sees one page flash into another:
    //  - a returning visitor (cookie) or a link that already says who they are: their page;
    //  - ?xp=control, or a visitor already placed in the original group: the original page;
    //  - anyone else: just the question.
    const jar = await cookies()
    const placed = decodeXp(jar.get(XP_COOKIE)?.value)?.variant
    const forcedControl = one(params.xp) === 'control' || (placed === 'control' && one(params.xp) !== 'intent')
    if (!forcedControl) {
      initialDoor = parseDoorCookie(jar.get(DOOR_COOKIE)?.value) ?? (intentPrior.confidence >= 0.75 ? intentPrior.door : null)
      initialAsking = !initialDoor
    }
  }
  const legacy = <HomeClient initialCurrency={currency} scanStats={stats} initialSegment={segment} appsBuiltStat={appsBuiltStat} galleryApps={galleryApps} userBuilds={userBuilds} intentPrior={intentPrior} initialDoor={initialDoor} initialAsking={initialAsking} />
  // The Signal design is on by default. NEXT_PUBLIC_SIGNAL_DESIGN=0 is the kill switch: it restores the previous homepage.
  const signalOn = process.env.NEXT_PUBLIC_SIGNAL_DESIGN !== '0'
  return (
    <>
      {signalOn ? <HomeSwitch signal={<SignalFrame><SignalHome usd={currency !== 'INR'} /></SignalFrame>} legacy={legacy} /> : legacy}
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  )
}
