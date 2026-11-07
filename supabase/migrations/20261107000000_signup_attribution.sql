-- First-touch signup attribution (see src/lib/signup-attribution.ts).
-- Additive and nullable: existing rows stay NULL, and onboardUser ignores a
-- missing column, so this can be applied any time after the code ships.
alter table profiles add column if not exists signup_source text;
alter table profiles add column if not exists signup_medium text;
alter table profiles add column if not exists signup_campaign text;
alter table profiles add column if not exists signup_referrer_host text;
alter table profiles add column if not exists signup_landing_path text;

create index if not exists idx_profiles_signup_source on profiles (signup_source);
