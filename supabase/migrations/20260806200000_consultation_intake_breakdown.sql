-- Add intake form answers, conversion ideas, and breakdown tracking to consultation_meetings
alter table public.consultation_meetings
  add column if not exists intake_answers    jsonb,
  add column if not exists conversion_ideas  text,
  add column if not exists breakdown_sent_at timestamptz,
  add column if not exists breakdown_payload jsonb;
