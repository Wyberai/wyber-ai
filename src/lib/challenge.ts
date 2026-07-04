// Weekly Build Challenge — opt-in gallery + community upvotes.
//
// Dark-launched: with NEXT_PUBLIC_CHALLENGE_GALLERY_ENABLED unset/false the
// gallery + submit flow are hidden from the public. Flip it to 'true' only
// after the challenge_entries/challenge_votes migration is applied on prod.
// (Admins always see the section so they can preview it before launch.)

export const CHALLENGE_GALLERY_ENABLED =
  process.env.NEXT_PUBLIC_CHALLENGE_GALLERY_ENABLED === 'true'

// Anonymous per-browser voter token — lets people upvote shared builds without
// signing in (removes friction on social traffic). One vote per token per entry.
export const VOTER_COOKIE = 'wv_voter'

// Prize credit amounts, matching the /challenge page copy.
export const AWARD_CREDITS = { editor: 2000, upvoted: 1000 } as const
export type AwardPlace = keyof typeof AWARD_CREDITS
export const AWARD_LABEL: Record<AwardPlace, string> = { editor: "Editor's Pick", upvoted: 'Most Upvoted' }

// ISO-8601 week key (e.g. '2026-W27'), matching how winners are announced each
// Sunday. Weeks are Monday-start; the key rolls over consistently server-side.
export function currentChallengeWeek(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (date.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
