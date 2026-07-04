-- Push-notification device tokens for the WyberAi companion mobile app.
-- The app (wyberai-mobile) upserts the signed-in user's Expo push token here
-- with the user-session client, so RLS must let a user manage only their own
-- rows. The server (admin client) reads them to fan out Expo push sends.

create table if not exists public.device_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  token      text        not null unique,          -- ExponentPushToken[...]
  platform   text        not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'device_tokens' and policyname = 'device_tokens: own select'
  ) then
    create policy "device_tokens: own select"
      on public.device_tokens for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'device_tokens' and policyname = 'device_tokens: own insert'
  ) then
    create policy "device_tokens: own insert"
      on public.device_tokens for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'device_tokens' and policyname = 'device_tokens: own update'
  ) then
    create policy "device_tokens: own update"
      on public.device_tokens for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'device_tokens' and policyname = 'device_tokens: own delete'
  ) then
    create policy "device_tokens: own delete"
      on public.device_tokens for delete
      using (auth.uid() = user_id);
  end if;
end $$;
