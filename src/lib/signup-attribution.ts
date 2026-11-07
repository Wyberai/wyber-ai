// First-touch signup attribution.
//
// The Oct 26 audit found 779 signups with no way to say where any of them came
// from: traffic_hits only counts /go clicks and profiles had no source fields.
// This captures the FIRST visit's UTMs / referrer / landing page in a cookie
// (see AttributionCapture), and onboardUser copies it onto the profile at
// signup. Pure functions only here so it is testable without a browser.

export const ATTRIBUTION_COOKIE = 'wyber_attr'
export const ATTRIBUTION_COOKIE_DAYS = 90

export interface SignupAttribution {
  source: string
  medium: string | null
  campaign: string | null
  referrerHost: string | null
  landingPath: string
}

const MAX = { source: 64, medium: 32, campaign: 64, host: 100, path: 120 }

function clean(value: string | null | undefined, max: number): string | null {
  const v = (value ?? '').trim().toLowerCase().replace(/[^a-z0-9._:/\-+ ]/g, '').slice(0, max)
  return v || null
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '') || null
  } catch {
    return null
  }
}

function isOwnHost(host: string): boolean {
  return host === 'wyberai.com' || host.endsWith('.wyberai.com') || host === 'localhost'
}

/**
 * Work out where a visit came from. Returns null when the visit carries no
 * signal at all and is not worth a cookie overwrite (internal navigation).
 * Precedence: explicit utm_source, then ad click ids, then an external
 * referrer host, then "direct".
 */
export function parseAttribution(input: {
  search: string
  referrer: string | null
  pathname: string
}): SignupAttribution | null {
  const params = new URLSearchParams(input.search)
  const utmSource = clean(params.get('utm_source'), MAX.source)
  const refHost = hostOf(input.referrer)
  const externalRef = refHost && !isOwnHost(refHost) ? refHost : null

  let source: string | null = utmSource
  if (!source && params.get('fbclid')) source = 'meta-ads'
  if (!source && params.get('gclid')) source = 'google-ads'
  if (!source && params.get('li_fat_id')) source = 'linkedin-ads'
  if (!source && externalRef) source = externalRef
  // Internal navigation with no tags: not a first touch we can learn from.
  if (!source && refHost && !externalRef) return null
  if (!source) source = 'direct'

  const path = input.pathname.startsWith('/') ? input.pathname : `/${input.pathname}`
  return {
    source,
    medium: clean(params.get('utm_medium'), MAX.medium),
    campaign: clean(params.get('utm_campaign'), MAX.campaign),
    referrerHost: externalRef ? externalRef.slice(0, MAX.host) : null,
    landingPath: path.slice(0, MAX.path),
  }
}

export function encodeAttribution(a: SignupAttribution): string {
  return encodeURIComponent(JSON.stringify(a))
}

/** Defensive: the cookie is user-controlled, so re-validate every field. */
export function decodeAttribution(raw: string | null | undefined): SignupAttribution | null {
  if (!raw) return null
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>
    const source = clean(typeof o.source === 'string' ? o.source : null, MAX.source)
    if (!source) return null
    const path = typeof o.landingPath === 'string' && o.landingPath.startsWith('/') ? o.landingPath.slice(0, MAX.path) : '/'
    return {
      source,
      medium: clean(typeof o.medium === 'string' ? o.medium : null, MAX.medium),
      campaign: clean(typeof o.campaign === 'string' ? o.campaign : null, MAX.campaign),
      referrerHost: clean(typeof o.referrerHost === 'string' ? o.referrerHost : null, MAX.host),
      landingPath: path.replace(/[^\x20-\x7e]/g, ''),
    }
  } catch {
    return null
  }
}

/** Column values for profiles, or null when there is nothing to record. */
export function attributionToProfileColumns(raw: string | null | undefined): Record<string, string | null> | null {
  const a = decodeAttribution(raw)
  if (!a) return null
  return {
    signup_source: a.source,
    signup_medium: a.medium,
    signup_campaign: a.campaign,
    signup_referrer_host: a.referrerHost,
    signup_landing_path: a.landingPath,
  }
}
