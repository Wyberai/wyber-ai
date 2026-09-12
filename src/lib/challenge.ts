// Wyber Premier League — opt-in gallery + community upvotes + monthly cash prizes.
// (Formerly the Weekly Build Challenge — same underlying tables/APIs, rebranded
// and moved to a monthly cycle. See challenge_entries' `period` column.)
//
// Dark-launched: with NEXT_PUBLIC_CHALLENGE_GALLERY_ENABLED unset/false the
// gallery + submit flow are hidden from the public. Flip it to 'true' only
// after the wpl_prizes migration is applied on prod.
// (Admins always see the section so they can preview it before launch.)

export const CHALLENGE_GALLERY_ENABLED =
  process.env.NEXT_PUBLIC_CHALLENGE_GALLERY_ENABLED === 'true'

// Anonymous per-browser voter token — lets people upvote shared builds without
// signing in (removes friction on social traffic). One vote per token per entry.
export const VOTER_COOKIE = 'wv_voter'

// Real cash prizes (USD), matching the /premier-league page copy. Awarding no
// longer grants in-app credits (see api/admin/challenge/award) — these are
// paid out manually via bank transfer/PayPal once a winner is marked.
export const PRIZE_USD = { editor: 1000, upvoted: 500, creative: 300 } as const
export type AwardPlace = keyof typeof PRIZE_USD
export const AWARD_LABEL: Record<AwardPlace, string> = { editor: 'WPL Champion', upvoted: 'Fan Favorite', creative: 'Most Creative' }

// Calendar-month cycle key (e.g. '2026-09'). Winners are announced on the 1st
// of the following month; unlike the old ISO-week key this is UTC-calendar-month,
// not week-of-year.
export function currentWplMonth(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
