-- Workflow templates stored in DB for scalable template gallery
create table if not exists workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null default '',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists wf_templates_cat_idx on workflow_templates(category);
create index if not exists wf_templates_name_idx on workflow_templates using gin(to_tsvector('english', name || ' ' || description));
