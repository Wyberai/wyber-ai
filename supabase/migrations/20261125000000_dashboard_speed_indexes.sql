-- Dashboard speed: the lookups the dashboard runs on every load had no index to use, so the database read every row.
--   projects by owner, newest first      (the project list)
--   security_scans by owner, newest first (the security badge per project)
--   organization_members by user          (which orgs the person belongs to)
-- Each index is created only if it is missing and only if its table and columns exist, so this is safe to run twice and
-- cannot fail the run. Nothing is deleted or changed. On a large table the build briefly takes a lock; these tables are
-- small enough that it is over in moments.

do $$
begin
  if to_regclass('public.projects') is not null then
    begin
      create index if not exists idx_projects_user_updated on public.projects (user_id, updated_at desc);
    exception when others then raise notice 'projects index skipped: %', sqlerrm;
    end;
  end if;

  if to_regclass('public.security_scans') is not null then
    begin
      create index if not exists idx_security_scans_user_created on public.security_scans (user_id, created_at desc);
    exception when others then raise notice 'security_scans index skipped: %', sqlerrm;
    end;
  end if;

  if to_regclass('public.organization_members') is not null then
    begin
      create index if not exists idx_org_members_user on public.organization_members (user_id);
    exception when others then raise notice 'organization_members index skipped: %', sqlerrm;
    end;
  end if;
end $$;
