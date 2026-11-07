-- Three more company agents: onboarding, reengage, content.
alter table ops_agent_drafts drop constraint if exists ops_agent_drafts_agent_check;
alter table ops_agent_drafts add constraint ops_agent_drafts_agent_check
  check (agent in ('outreach', 'followup', 'meeting_prep', 'proposal', 'weekly_coach', 'onboarding', 'reengage', 'content'));
