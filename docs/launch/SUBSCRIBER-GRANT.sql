-- OPTIONAL one-off: give current paid subscribers the extra credits TODAY instead of at next renewal.
-- Not run. Review the preview query first. Run only after the new build is promoted, and only once.
-- The extra is (new monthly amount - old monthly amount): Spark +100, Starter +300, Builder +1000, Pro +3000.
-- Check the real column names against the profiles table before running; they are assumed here.

-- 1) PREVIEW (read-only): who would get what
select plan, count(*) as subscribers,
       case plan when 'spark' then 100 when 'starter' then 300 when 'builder' then 1000 when 'pro' then 3000
                 when 'growth' then 8000 when 'scale' then 20000 end as extra_each
from profiles
where subscription_status = 'active' and plan in ('spark','starter','builder','pro','growth','scale')
group by plan order by 1;

-- 2) APPLY (uncomment to run)
-- update profiles
-- set credits = credits + case plan when 'spark' then 100 when 'starter' then 300 when 'builder' then 1000
--                                   when 'pro' then 3000 when 'growth' then 8000 when 'scale' then 20000 end
-- where subscription_status = 'active' and plan in ('spark','starter','builder','pro','growth','scale');
