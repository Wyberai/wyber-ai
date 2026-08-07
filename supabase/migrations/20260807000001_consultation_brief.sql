alter table consultation_meetings add column if not exists ai_brief jsonb;
alter table consultation_meetings add column if not exists summary_sent_at timestamptz;
