-- Fix project_collaborators RLS — allow users to read collaborators for projects they own
-- This fixes "permission denied for table project_collaborators" when opening agents/projects

-- Drop and recreate to ensure clean state
drop policy if exists "owner manages collaborators" on project_collaborators;
drop policy if exists "collaborator sees own invites" on project_collaborators;
drop policy if exists "Users manage own collaborators" on project_collaborators;

-- Owner can do everything
create policy "owner manages collaborators" on project_collaborators
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Collaborators can see their own invites
create policy "collaborator sees own invites" on project_collaborators
  for select using (auth.uid() = collaborator_id OR collaborator_email = (select email from auth.users where id = auth.uid()));

-- Also fix projects table — ensure users can create projects
drop policy if exists "users manage own projects" on projects;
create policy "users manage own projects" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow reading projects where user is a collaborator
drop policy if exists "collaborators can read shared projects" on projects;
create policy "collaborators can read shared projects" on projects
  for select using (
    auth.uid() = user_id
    OR exists (
      select 1 from project_collaborators
      where project_id = projects.id
      and collaborator_id = auth.uid()
      and status = 'accepted'
    )
  );
