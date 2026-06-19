-- Add persona column to profiles for tailored onboarding experience
alter table profiles add column if not exists persona text
  check (persona in ('solo', 'team', 'agency', 'enterprise'));
