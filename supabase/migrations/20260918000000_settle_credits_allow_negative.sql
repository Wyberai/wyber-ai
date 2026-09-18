-- deduct_credits (20260702130000) is guarded by `credits >= p_amount` and
-- returns NULL instead of charging when the balance is too low. That's the
-- right behavior for the UPFRONT gate before any generation runs — never do
-- free work nobody can pay for. But the build-overage and edit-settlement
-- top-ups in /api/generate run AFTER the real work already shipped, pricing
-- off actual measured output tokens. Reusing deduct_credits there means a
-- turn that ran hotter than its flat price right as a user's balance got
-- low simply writes off the difference — confirmed live: an account near
-- empty generated a turn whose real settlement owed ~16cr more, collected
-- nothing, kept its stale low balance instead of going negative, and could
-- still attempt further turns until the plain flat-price gate caught it.
--
-- settle_credits_allow_negative always deducts the full amount — never
-- fails, never floors at zero — so the true cost of work already delivered
-- is always recorded on the ledger. It must ONLY be called for settlement/
-- overage collection (never the pre-generation balance gate): the existing
-- `balance < cost` check on the next request already stops further builds
-- once this pushes an account negative, so no separate gate is needed.
-- Returns json (matching deduct_credits' shape) so call sites can keep using
-- the same `result?.new_credits !== undefined` success check unchanged.
create or replace function settle_credits_allow_negative(p_user_id uuid, p_amount integer)
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
   returning credits into v_new;
  if v_new is null then
    return null; -- unknown user
  end if;
  return json_build_object('new_credits', v_new);
end $$;

revoke all on function settle_credits_allow_negative(uuid, integer) from public;
revoke all on function settle_credits_allow_negative(uuid, integer) from anon, authenticated;
grant execute on function settle_credits_allow_negative(uuid, integer) to service_role;
