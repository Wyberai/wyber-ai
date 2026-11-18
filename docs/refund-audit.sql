-- Refund audit for the credit ledger (run in the Supabase SQL editor). Read-only.
-- Written 18 Nov 2026 after the owner saw full refunds next to builds that finished.
-- Since this date the generate route writes the reason as  refund:<why>|<stage>|<action>|p=<first 8 chars of project id>
-- so new rows can be matched to a project. Older rows only say refund:<why>.

-- 1. What kinds of refunds happen, and how many credits go back (last 14 days).
select split_part(reason, '|', 1) as kind,
       count(*)                   as refunds,
       sum(-amount)               as credits_returned
from credit_usage
where reason like 'refund:%' and created_at > now() - interval '14 days'
group by 1
order by refunds desc;

-- 2. Refunds followed by a new charge for the same user within 15 minutes.
--    That pattern is "the pass failed, was refunded, the retry went through": the build exists and the user paid nothing.
with r as (
  select user_id, created_at, reason, -amount as refunded
  from credit_usage
  where reason like 'refund:%' and created_at > now() - interval '14 days'
)
select r.user_id, r.created_at, r.reason, r.refunded,
       (select count(*) from credit_usage c
         where c.user_id = r.user_id and c.amount > 0 and c.reason not like 'refund:%'
           and c.created_at between r.created_at and r.created_at + interval '15 minutes') as charges_in_next_15_min,
       (select coalesce(sum(c.amount), 0) from credit_usage c
         where c.user_id = r.user_id and c.amount > 0 and c.reason not like 'refund:%'
           and c.created_at between r.created_at and r.created_at + interval '15 minutes') as credits_charged_in_next_15_min
from r
order by r.created_at desc
limit 100;

-- 3. Users with the most credits refunded, against what they were charged (is anyone getting builds for free?).
select user_id,
       sum(case when amount > 0 and reason not like 'refund:%' then amount else 0 end) as charged,
       sum(case when reason like 'refund:%' then -amount else 0 end)                   as refunded,
       count(*) filter (where reason like 'refund:%')                                  as refund_count
from credit_usage
where created_at > now() - interval '14 days'
group by user_id
having sum(case when reason like 'refund:%' then -amount else 0 end) > 0
order by refunded desc
limit 30;

-- 4. (Rows written after this change) refunds on projects that DO have files, i.e. a refund on a build that exists.
select cu.created_at, cu.reason, -cu.amount as refunded, p.id as project, p.name,
       (select count(*) from jsonb_object_keys(p.files)) as files_in_project
from credit_usage cu
join projects p on p.id::text like substring(cu.reason from 'p=([0-9a-f]{8})') || '%'
where cu.reason like 'refund:%|p=%' and cu.created_at > now() - interval '14 days'
order by cu.created_at desc
limit 50;
