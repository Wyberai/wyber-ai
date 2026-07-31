-- Per-event push/notification opt-out (mobile Settings → Notifications).
-- Shape: { [eventType]: boolean } — absent key means enabled (default-on),
-- so this is purely additive and never breaks existing notify()/notifyPush()
-- callers that don't know about it.
alter table profiles add column if not exists notification_prefs jsonb not null default '{}'::jsonb;
