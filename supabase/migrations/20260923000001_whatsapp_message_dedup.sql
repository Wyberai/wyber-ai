-- ============================================================
-- Migration: WhatsApp inbound message dedup
-- ============================================================
-- Meta's webhook delivery is at-least-once, not exactly-once — a slow ack,
-- a transient 5xx, or just Meta's own retry policy can (and does, in
-- practice) redeliver the identical inbound message. Without a guard, a
-- redelivered "build me a habit tracker" would create a second project or
-- queue a second build against the same message, double-charging credits
-- for one thing the user asked for once.
--
-- Pure idempotency log: the webhook INSERTs the WhatsApp message id (wamid)
-- before doing anything else. A unique-constraint failure means "already
-- handled this exact delivery, skip it" — cheaper and simpler than trying to
-- make every downstream effect (project creation, credit deduction, queue
-- insert) itself idempotent.
create table if not exists public.whatsapp_message_log (
  wa_message_id text primary key,
  received_at   timestamptz not null default now()
);

alter table public.whatsapp_message_log enable row level security;
-- No policies: service-role only (the webhook handler), same convention as
-- whatsapp_identities and mcp_messages — no browser client ever touches this.
