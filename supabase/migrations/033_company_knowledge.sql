-- ── Company knowledge (org-level intel, shared across a customer's employees) ──
-- The customer uploads their brand book, product docs, ICP, past campaigns ONCE;
-- every employee they hire recalls it semantically. This is the layer that makes
-- an employee feel built for THIS business. Keyed by the hiring account (user_id),
-- with optional org_id for multi-seat orgs. Each row is an embedded chunk.

create extension if not exists vector;

create table if not exists public.company_knowledge (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  org_id      uuid,
  doc_title   text not null,
  source      text,                       -- 'upload' | 'url' | 'note'
  content     text not null,              -- the chunk text
  chunk_index int not null default 0,
  embedding   vector(1024),
  created_at  timestamptz not null default now()
);

alter table public.company_knowledge enable row level security;
drop policy if exists "users manage own company knowledge" on public.company_knowledge;
create policy "users manage own company knowledge" on public.company_knowledge for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_company_knowledge_user on public.company_knowledge(user_id, created_at desc);
create index if not exists idx_company_knowledge_vec on public.company_knowledge using hnsw (embedding vector_cosine_ops);

-- Semantic recall scoped to an account.
create or replace function public.match_company_knowledge(p_user_id uuid, p_query vector(1024), p_k int default 6)
returns setof public.company_knowledge language sql stable as $$
  select * from public.company_knowledge where user_id = p_user_id and embedding is not null
  order by embedding <=> p_query limit greatest(p_k, 1);
$$;

grant all on public.company_knowledge to service_role;
grant select, insert, update, delete on public.company_knowledge to authenticated;
