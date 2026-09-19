// Single source of truth for the referral-code redemption cap. Two
// completely separate code paths redeem a referral code — the manual
// "enter a code" endpoint (src/app/api/referral/route.ts) and the
// link-based `?ref=CODE` signup flow (src/lib/auth/onboard-user.ts) — and
// they drifted out of sync: one enforced 3, the other enforced 5 and, past
// its own cap, kept minting new-account welcome bonuses forever with only
// the referrer's payout turned off. Both now import this one constant and
// both fully stop the redemption (no referred_by link, no new-account
// bonus, no referrer payout) once a code has paid out this many times.
export const REFERRAL_LIMIT = 3
