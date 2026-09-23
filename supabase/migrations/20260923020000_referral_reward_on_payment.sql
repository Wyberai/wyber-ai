-- The referrer's 50-credit reward used to pay out the moment the referred
-- friend SIGNED UP, regardless of whether that friend ever paid — so the
-- referral loop was optimized for free signups, not revenue. This flips the
-- referrer payout to fire on the referred user's first real payment instead
-- (src/lib/referral.ts rewardReferrerOnFirstPayment, called from the Dodo
-- webhook). The new-user's own 20-credit welcome bonus is unchanged — that
-- still grants at signup.
--
-- One flag per REFERRED user (not per referrer) so a referrer is paid at
-- most once per person they brought in, no matter how many payments that
-- person later makes — same reasoning as affiliate_commissions' payment-id
-- uniqueness, just scoped to the referred user instead of the payment.

alter table profiles
  add column if not exists referral_reward_paid boolean not null default false;
