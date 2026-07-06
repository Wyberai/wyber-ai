-- Persist the visitor's IP country on the profile so server-side lifecycle
-- emails (sent from cron, which have no request IP) can localize currency:
-- India (IN) -> INR, everyone else -> USD. Nullable; a null/unknown country
-- falls back to USD in code, so this is safe to deploy before or after apply.
alter table public.profiles add column if not exists country text;
