-- Extend consultation_meetings with fields needed for the admin ROI dashboard:
-- notes (free-text call notes), recording_url (Google Meet recording link),
-- converted (did this meeting turn into a paid project?), deal_value (revenue
-- attributed to the meeting in USD), and source (traffic source for grouping).
alter table public.consultation_meetings
  add column if not exists notes         text,
  add column if not exists recording_url text,
  add column if not exists converted     boolean not null default false,
  add column if not exists deal_value    numeric(10,2),
  add column if not exists source        text not null default 'meta_ad';

create index if not exists idx_consultation_meetings_converted
  on public.consultation_meetings(converted);
