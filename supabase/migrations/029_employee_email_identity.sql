-- ── AI Employee email identity ────────────────────────────────────────────────
-- Gives each employee a real, addressable mailbox. The email is the credential
-- anchor: customers assign 3rd-party tool accounts (Gong, HubSpot, Zoom, …) to
-- this address, meeting invites land here so the employee can RSVP/auto-join, and
-- inbound requests ("Marcus, draft the Q3 campaign") are parsed into work runs.
--
-- Default domain is Wyber-owned (employees.wyberai.com). Enterprise customers can
-- later override email_domain with their own delegated domain.

alter table public.ai_employees
  add column if not exists email_local   text,                                  -- e.g. "marcus.a3f9"
  add column if not exists email_domain  text default 'employees.wyberai.com',
  add column if not exists email_address text,                                  -- full address, denormalized for lookup
  add column if not exists avatar_url    text,                                  -- human face for the profile page
  add column if not exists handle        text;                                  -- public profile slug, e.g. "marcus-sutar"

-- Inbound matching depends on a fast, unique lookup by full address.
create unique index if not exists idx_ai_employees_email_address
  on public.ai_employees(lower(email_address))
  where email_address is not null;

create unique index if not exists idx_ai_employees_handle
  on public.ai_employees(lower(handle))
  where handle is not null;

-- ── Employee email log ────────────────────────────────────────────────────────
-- Every message the employee receives or sends. Inbound rows are created by the
-- Resend inbound webhook; outbound rows by the employee when it replies/sends.
create table if not exists public.employee_emails (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.ai_employees(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  direction     text not null,                       -- 'inbound' | 'outbound'
  from_address  text not null,
  to_address    text not null,
  cc            text[],
  subject       text,
  body_text     text,
  body_html     text,
  message_id    text,                                -- provider Message-ID header
  in_reply_to   text,                                -- threading: parent Message-ID
  status        text not null default 'received',    -- received | processing | replied | sent | ignored | error
  run_id        uuid references public.ai_employee_runs(id) on delete set null,
  error_message text,
  created_at    timestamptz not null default now()
);

alter table public.employee_emails enable row level security;

create policy "users manage own employee emails"
  on public.employee_emails for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_employee_emails_employee
  on public.employee_emails(employee_id, created_at desc);

create index if not exists idx_employee_emails_message_id
  on public.employee_emails(message_id)
  where message_id is not null;
