-- One free automatic build-time image generation per project (the
-- {{wyber-image}} directives resolved during preview/publish); every one
-- after that is charged. Previously unlimited and free — resolve-directives
-- and publish both call generateAndPersistImage with zero credit gating, so
-- a build with several image directives incurred real OpenAI cost with no
-- billing at all.
--
-- Atomic via a single UPDATE ... WHERE ... RETURNING so parallel directive
-- resolution (resolve-directives processes up to 8 per call via Promise.all)
-- can't have two directives both see "0 used" and both consume the one slot.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account — same as
-- 20260703090000_grant_credit_fns_service_role.sql).

alter table projects add column if not exists free_images_used integer not null default 0;

create or replace function consume_free_image_slot(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_used integer;
begin
  update projects
     set free_images_used = free_images_used + 1
   where id = p_project_id
     and free_images_used < 1
   returning free_images_used into v_used;
  return v_used is not null;
end $$;

revoke all on function consume_free_image_slot(uuid) from public;
revoke all on function consume_free_image_slot(uuid) from anon, authenticated;
grant execute on function consume_free_image_slot(uuid) to service_role;
