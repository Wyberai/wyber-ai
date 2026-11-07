-- Payment tracking on quotes + the collections agent.
alter table crm_quotes add column if not exists paid_at timestamptz;
alter table ops_agent_drafts drop constraint if exists ops_agent_drafts_agent_check;
alter table ops_agent_drafts add constraint ops_agent_drafts_agent_check
  check (agent in ('outreach', 'followup', 'meeting_prep', 'proposal', 'weekly_coach', 'onboarding', 'reengage', 'content', 'collections'));
