import type { HomeStrings } from '@/lib/i18n/home-translations';

// Visitor-adaptive hero copy. The homepage is already per-request rendered at
// the edge (see app/page.tsx), so we resolve a "segment" from the signals on
// the request — utm params and the referer — and swap in copy written for that
// visitor. Untagged organic/direct traffic NEVER matches a segment and sees
// the exact default copy, so this is additive-only by construction.
//
// Copy overrides are English-only: India's hi/kn/te/ta locales already carry
// their own adapted hero (see i18n/home-translations.ts) and the merge in
// HomeClient only applies when locale === 'en'.
//
// Kill switch: NEXT_PUBLIC_ADAPTIVE_HERO=0 (checked at the call site in
// app/page.tsx — this module stays pure/testable).

export type HeroSegment = 'security' | 'devshop' | 'badge';

export interface HeroSegmentSignals {
  utmSource?: string | null;
  utmCampaign?: string | null;
  referer?: string | null;
}

/** Hero-only field overrides; everything absent falls through to the default. */
export const HERO_SEGMENT_STRINGS: Record<HeroSegment, Partial<HomeStrings>> = {
  // Security-conscious arrivals: the RLS-scanner emails + /tools scanner pages
  // (utm_source=scanner_email / tools, utm_campaign=scanner), and organic
  // referrals from Reddit/HN — the "vibe-coded apps leak keys" crowd.
  security: {
    eyebrowMain: 'THE SECURITY-FIRST APP BUILDER',
    heroLine1: 'Build it fast.',
    heroLine2: 'Ship it locked.',
    heroLead:
      "Every build gets a live database security scan — we probe your app with an attacker's anon key before you publish, and critical leaks block the gate. Same prompt-to-app speed as the other builders. Minus the leaked-keys postmortem.",
    heroPlaceholder: 'Describe your app… we scan every build before it ships',
  },
  // Arrivals via the "Made with WyberAi" badge on a published app
  // (app/[slug]/page.tsx tags utm_source=made-with-badge): they've just USED
  // a WyberAi build, so the pitch is proof-by-what-you-just-saw.
  badge: {
    eyebrowMain: 'THE BUILDER BEHIND THAT APP',
    heroLine1: 'That app you just used?',
    heroLine2: 'Built from one prompt.',
    heroLead:
      'No dev team. Someone described it in plain English and WyberAi engineered the rest — web or mobile, self-healing builds, a live database security scan before it shipped. Your idea can be live before you close this tab.',
    heroPlaceholder: 'Describe your app… yours could be next',
  },
  // Dev shops / agencies from GTM outreach (tag links utm_campaign=devshop or
  // utm_source=devshop): they sell client work, so the pitch is throughput.
  devshop: {
    eyebrowMain: 'THE APP BUILDER FOR CLIENT WORK',
    heroLine1: 'Quote it Monday.',
    heroLine2: 'Demo it Tuesday.',
    heroLead:
      'Turn client briefs into live, working demos before the next status call. Web or mobile from one prompt, self-healing builds, and security scans your clients can actually read. More projects per month — same headcount.',
    heroPlaceholder: 'Describe the client build… e.g. a booking portal for a dental clinic',
  },
};

const SECURITY_SOURCES = new Set(['scanner_email', 'tools', 'reddit', 'hn', 'hackernews']);
const SECURITY_REFERERS = ['reddit.com', 'news.ycombinator.com'];
const DEVSHOP_HINTS = ['devshop', 'agency'];

/** Pure resolution from request signals — null means "show the default hero". */
export function resolveHeroSegment(signals: HeroSegmentSignals): HeroSegment | null {
  const source = (signals.utmSource ?? '').toLowerCase();
  const campaign = (signals.utmCampaign ?? '').toLowerCase();
  const referer = (signals.referer ?? '').toLowerCase();

  // Devshop first: it's the narrower, deliberately-tagged outreach audience.
  if (DEVSHOP_HINTS.some(h => source.includes(h) || campaign.includes(h))) return 'devshop';

  // Exact match only: the outbound Product Hunt badge uses source
  // "badge-featured" and must NOT trip this (it never arrives inbound anyway,
  // but keep the contract tight).
  if (source === 'made-with-badge') return 'badge';

  if (
    SECURITY_SOURCES.has(source) ||
    campaign.includes('scanner') ||
    campaign.includes('security') ||
    SECURITY_REFERERS.some(h => referer.includes(h))
  ) {
    return 'security';
  }

  return null;
}
