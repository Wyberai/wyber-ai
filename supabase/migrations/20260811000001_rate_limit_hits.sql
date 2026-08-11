-- ============================================================
-- Migration: durable rate limiting for the OAuth token/register endpoints
-- ============================================================
-- src/lib/rate-limit.ts is an in-memory Map — on Vercel's serverless model
-- it resets on every cold start and isn't shared across concurrent instances,
-- so the "60 requests/10min per IP" bound on /api/oauth/token and
-- /api/oauth/register was much weaker in practice than it read (PKCE +
-- 256-bit random codes/tokens are the real defense either way, but the
-- rate limit itself should actually hold). This table + RPC give those two
-- endpoints a durable, atomic counter instead.

create table if not exists public.rate_limit_hits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Atomic increment-or-reset-then-increment, single round trip. Loops once on
-- the rare race where two concurrent first-requests for a brand-new key both
-- miss the UPDATE and try to INSERT — the loser retries as an UPDATE instead
-- of erroring.
create or replace function public.rate_limit_hit(p_key text, p_window_ms bigint, p_max int)
returns table(allowed boolean, remaining int)
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_count int;
  v_window_start timestamptz;
begin
  loop
    update public.rate_limit_hits
      set count = case when window_start + (p_window_ms::text || ' milliseconds')::interval <= v_now then 1 else count + 1 end,
          window_start = case when window_start + (p_window_ms::text || ' milliseconds')::interval <= v_now then v_now else window_start end
      where key = p_key
      returning count, window_start into v_count, v_window_start;
    if found then
      exit;
    end if;
    begin
      insert into public.rate_limit_hits (key, count, window_start) values (p_key, 1, v_now)
        returning count, window_start into v_count, v_window_start;
      exit;
    exception when unique_violation then
      -- concurrent first-insert for this key won the race — retry as an update
    end;
  end loop;

  if v_count > p_max then
    return query select false, 0;
  else
    return query select true, (p_max - v_count);
  end if;
end;
$$;

grant execute on function public.rate_limit_hit(text, bigint, int) to service_role;

-- Stale rows never get read again once their window passes, but nothing
-- prunes them — this index lets an occasional cleanup job find them cheaply.
create index if not exists idx_rate_limit_hits_window_start on public.rate_limit_hits(window_start);
