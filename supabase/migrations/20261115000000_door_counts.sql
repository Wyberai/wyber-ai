-- Anonymous, aggregate counts for the four homepage doors (Solve a problem, Build apps, Work for clients, Just scrolling),
-- so we can see which door people choose and where they stop. One row per day, door and step with a running count.
-- Nothing personal is stored: no user id, no IP, no cookie, no text the visitor typed. It is a counter, not a log.
-- Additive and re-runnable.

create table if not exists public.door_counts (
  day  date   not null,
  door text   not null,
  step text   not null,
  n    bigint not null default 0,
  primary key (day, door, step)
);

alter table public.door_counts enable row level security;
-- No policies on purpose: only the service role (the API route and the founder's queries) can read or write.

create or replace function public.door_count_inc(p_door text, p_step text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.door_counts (day, door, step, n) values (current_date, p_door, p_step, 1)
  on conflict (day, door, step) do update set n = public.door_counts.n + 1;
$$;

revoke all on function public.door_count_inc(text, text) from public, anon, authenticated;
grant execute on function public.door_count_inc(text, text) to service_role;

-- To read it (service role / SQL editor):
--   select door, step, sum(n) from public.door_counts where day >= current_date - 7 group by 1, 2 order by 1, 3 desc;
