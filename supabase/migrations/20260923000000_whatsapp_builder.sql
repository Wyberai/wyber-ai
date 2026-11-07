-- ============================================================
-- Migration: WhatsApp-native builder
-- ============================================================
-- Lets someone build/edit a WyberAi project entirely by texting a WhatsApp
-- number. Two additions:
--
-- 1. whatsapp_identities: maps a phone number to a WyberAi account. There is
--    no phone-based identity anywhere else in this schema, so this is a new
--    net-new mapping table rather than a column on profiles — a phone should
--    not be forced into a hard 1:1 with a profile (a user could someday
--    re-link a different number, or the reverse). Onboarding is gated: a
--    brand-new phone number must prove ownership of an EXISTING WyberAi
--    account's email (via Supabase's own email-OTP flow) before it can
--    trigger any build — see src/lib/whatsapp/identity.ts. This intentionally
--    mirrors the "gated, not frictionless" call made for the WhatsApp
--    scoping conversation: anonymous phone numbers must not be able to spin
--    up free-credit accounts un-throttled.
--
-- 2. mcp_messages.channel + mcp_messages.whatsapp_identity_id: the WhatsApp
--    webhook reuses the EXACT same queue/worker (mcp_messages +
--    cron/mcp-consumer + build-runner.ts) that already runs MCP-originated
--    builds headlessly — channel lets build-runner.ts know to notify over
--    WhatsApp instead of (or in addition to) just writing published_url to
--    the row, and whatsapp_identity_id avoids a reverse phone-number lookup
--    when it's time to send that notification.

create table if not exists public.whatsapp_identities (
  id                 uuid primary key default uuid_generate_v4(),
  phone_e164         text not null unique,          -- e.g. "919876543210", digits only, as WhatsApp sends it
  user_id            uuid references public.profiles(id) on delete cascade,
  status             text not null default 'pending_email', -- pending_email | pending_otp | linked
  pending_email      text,                           -- email the phone claimed while status = pending_email/pending_otp
  active_project_id  uuid references public.projects(id) on delete set null,
  last_message_at    timestamptz default now(),
  created_at         timestamptz default now()
);

alter table public.whatsapp_identities enable row level security;
create policy "users see own whatsapp_identities"
  on public.whatsapp_identities for select
  using (auth.uid() = user_id);
-- No insert/update/delete policy: only the service-role webhook/worker ever
-- writes this table (matches mcp_messages, credit_usage, etc. — the browser
-- client never touches these directly).

create index if not exists idx_whatsapp_identities_user on public.whatsapp_identities(user_id);

alter table public.mcp_messages
add column if not exists channel text not null default 'mcp', -- mcp | whatsapp
add column if not exists whatsapp_identity_id uuid references public.whatsapp_identities(id) on delete set null;

create index if not exists idx_mcp_messages_whatsapp_identity
  on public.mcp_messages(whatsapp_identity_id)
  where whatsapp_identity_id is not null;
