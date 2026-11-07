-- Which visitor-intent experiment group a signup came from (see src/lib/intent).
-- intent_anon_id links a profile to its anonymous rows in intent_events.
-- Additive and nullable; onboardUser ignores a missing column.
alter table profiles add column if not exists intent_anon_id text;
alter table profiles add column if not exists intent_variant text
  check (intent_variant is null or intent_variant in ('intent', 'control'));
create index if not exists idx_profiles_intent_variant on profiles (intent_variant);
