-- Reduce the free-signup credit grant from 50 to 30. Free credits + Meta ad
-- spend were running ~$56/day combined against near-zero conversion; the
-- upsell trigger (hitting the credit wall mid-build) stays the same, it just
-- fires sooner. Existing users' balances are untouched — this only changes
-- what NEW signups receive.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account) — same as prior
-- migrations that touch this project.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    30,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger itself is unchanged (still fires on auth.users insert) — only the
-- function body's credit amount changed, so no need to drop/recreate it.
