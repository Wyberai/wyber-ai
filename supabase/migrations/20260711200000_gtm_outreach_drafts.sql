-- Lead dedupe: the import routes upsert ON CONFLICT (user_id, email), but no
-- matching unique constraint ever existed — Apollo + CSV imports both 500'd.
create unique index if not exists uq_gtm_leads_user_email on gtm_leads(user_id, email);

-- Approval-queue support: outreach logs carry full drafts + signal citation.
-- Statuses used by the app: draft | approved | rejected | queued_provider | sent | failed
alter table gtm_outreach_logs add column if not exists body text;
alter table gtm_outreach_logs add column if not exists signal text;
alter table gtm_outreach_logs add column if not exists variables jsonb;
alter table gtm_outreach_logs add column if not exists approved_at timestamptz;

create index if not exists idx_gtm_outreach_logs_user_status on gtm_outreach_logs(user_id, status);
create index if not exists idx_gtm_suppressions_user_email on gtm_suppressions(user_id, email);
