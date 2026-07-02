-- Payments + credit-math hardening (failure-modes G3/G4).
--
-- 1. processed_webhooks: the Dodo webhook has ALWAYS written to this table for
--    idempotency, but the table was never created — every insert failed with
--    "relation does not exist", the code logged a warning and processed anyway,
--    so retried webhook deliveries could double-grant credits.
-- 2. deduct_credits: /api/credits/deduct has always called this RPC, falling
--    back to a racy two-step read/update because the function never existed.
--    Conditional atomic deduction: only succeeds when balance >= amount.
-- 3. adjust_credits: atomic +/- adjustment for top-ups, grants and refunds
--    (replaces read-then-write in the webhook and refundCredits).

-- ── 1. Webhook idempotency ─────────────────────────────────────────────────
create table if not exists processed_webhooks (
  id text primary key,
  source text not null default 'unknown',
  created_at timestamptz not null default now()
);
-- Service-role only (RLS on, no policies → anon/authenticated can't touch it).
alter table processed_webhooks enable row level security;

-- ── 2. Atomic conditional deduction ────────────────────────────────────────
-- Returns json {new_credits} on success, NULL when the balance is too low —
-- exactly the shape /api/credits/deduct already expects.
create or replace function deduct_credits(p_user_id uuid, p_amount integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v_new integer;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'invalid amount';
  end if;
  update profiles
     set credits = credits - p_amount,
         updated_at = now()
   where id = p_user_id
     and coalesce(credits, 0) >= p_amount
   returning credits into v_new;
  if v_new is null then
    return null; -- insufficient balance (or unknown user)
  end if;
  return json_build_object('new_credits', v_new);
end $$;

revoke all on function deduct_credits(uuid, integer) from public;
revoke all on function deduct_credits(uuid, integer) from anon, authenticated;

-- ── 3. Atomic adjustment (top-ups, grants, refunds) ────────────────────────
-- Positive delta adds, negative subtracts (floored at 0). Returns the new
-- balance, or NULL for an unknown user.
create or replace function adjust_credits(p_user_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_new integer;
begin
  update profiles
     set credits = greatest(0, coalesce(credits, 0) + coalesce(p_delta, 0)),
         updated_at = now()
   where id = p_user_id
   returning credits into v_new;
  return v_new;
end $$;

revoke all on function adjust_credits(uuid, integer) from public;
revoke all on function adjust_credits(uuid, integer) from anon, authenticated;
