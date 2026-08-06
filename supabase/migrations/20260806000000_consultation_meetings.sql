-- Tracks free US scoping-call bookings from Cal.com (wyber-ai-build-consultation
-- event type), populated by /api/cal/webhook. Lets the admin dashboard show
-- how many are scheduled vs. done, and drives the confirmation/1-day/30-min/
-- thank-you email cron (src/app/api/cron/consultation-reminders).
--
-- cal_booking_uid is Cal.com's own booking identifier — the unique constraint
-- makes webhook retries (booking.created firing twice) a no-op upsert rather
-- than a duplicate row. status is intentionally free text, not an enum: Cal.com's
-- webhook vocabulary may grow, and a rigid enum would reject events we haven't
-- mapped yet instead of just recording them as-is for later review.
create table if not exists public.consultation_meetings (
  id                    uuid primary key default uuid_generate_v4(),
  cal_booking_uid       text not null unique,
  attendee_name         text,
  attendee_email        text not null,
  scheduled_start       timestamptz not null,
  scheduled_end         timestamptz,
  status                text not null default 'scheduled', -- scheduled | cancelled | rescheduled | completed | no_show
  confirmation_sent_at  timestamptz,
  reminder_1day_sent_at timestamptz,
  reminder_30min_sent_at timestamptz,
  thankyou_sent_at      timestamptz,
  raw_payload           jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.consultation_meetings enable row level security;
-- Service-role only (RLS on, no policies) — same posture as checkout_attempts/
-- email_events/generation_usage_log. Written by the webhook + reminder cron
-- (both use the admin client), read by the admin dashboard (also admin client,
-- gated by isAdminEmail — see src/app/admin/*).

create index if not exists idx_consultation_meetings_status          on public.consultation_meetings(status);
create index if not exists idx_consultation_meetings_scheduled_start on public.consultation_meetings(scheduled_start);
create index if not exists idx_consultation_meetings_reminders_pending
  on public.consultation_meetings(scheduled_start)
  where status = 'scheduled' and (reminder_1day_sent_at is null or reminder_30min_sent_at is null);
