-- Free build-time image slot was a flat 1-per-project regardless of the
-- owner's plan. Per-plan quota (free=1, spark/starter=3, builder=5, pro=
-- unlimited) so upgrading actually buys more free hero images, not just more
-- credits to spend on them one at a time.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (see
-- 20260726030000_project_free_image_slot.sql for why).

create or replace function consume_free_image_slot(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_cap integer;
  v_used integer;
begin
  select pr.plan into v_plan
    from projects p
    join profiles pr on pr.id = p.user_id
   where p.id = p_project_id;

  v_cap := case v_plan
    when 'pro' then null       -- unlimited
    when 'builder' then 5
    when 'starter' then 3
    when 'spark' then 3
    else 1                     -- free / no plan
  end;

  if v_cap is null then
    update projects set free_images_used = free_images_used + 1 where id = p_project_id;
    return true;
  end if;

  update projects
     set free_images_used = free_images_used + 1
   where id = p_project_id
     and free_images_used < v_cap
   returning free_images_used into v_used;
  return v_used is not null;
end $$;

revoke all on function consume_free_image_slot(uuid) from public;
revoke all on function consume_free_image_slot(uuid) from anon, authenticated;
grant execute on function consume_free_image_slot(uuid) to service_role;
