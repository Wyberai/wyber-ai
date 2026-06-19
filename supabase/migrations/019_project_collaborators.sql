-- Project collaborators — allows team members to access a project
create table if not exists project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_email text not null,
  collaborator_id uuid references auth.users(id) on delete set null,
  role text not null default 'editor' check (role in ('viewer','editor')),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(project_id, collaborator_email)
);

alter table project_collaborators enable row level security;

-- Owner can manage invites
create policy "Owner can manage collaborators"
  on project_collaborators for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Collaborator can see & update their own invite
create policy "Collaborator can see own invite"
  on project_collaborators for select
  using (auth.uid() = collaborator_id);

create policy "Collaborator can accept/decline"
  on project_collaborators for update
  using (auth.uid() = collaborator_id)
  with check (auth.uid() = collaborator_id);

-- Allow collaborators to read projects they've been invited to
create policy "Collaborators can read shared projects"
  on projects for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from project_collaborators pc
      where pc.project_id = projects.id
        and pc.collaborator_id = auth.uid()
        and pc.status = 'accepted'
    )
  );

create index if not exists project_collaborators_project_idx on project_collaborators(project_id);
create index if not exists project_collaborators_collab_idx on project_collaborators(collaborator_id);
