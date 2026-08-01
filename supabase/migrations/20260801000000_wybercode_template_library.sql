-- WyberCode template/component library index (self-hosted coding agent —
-- see plan: GCS-backed template library + retrieval, the mechanism that
-- makes "multiple pages/screens within a minute" achievable without
-- generating everything from scratch on every build).
--
-- Actual template file bodies live in GCS (one object per version, under
-- gcs_path below); this table is just the searchable index row per template
-- version. Service-role only — retrieve()/promote() run server-side in
-- src/lib/template-library/, never exposed to the client directly.
--
-- Baseline retrieval strategy is Postgres full-text search over
-- description+archetype (search_vector below), not a vector-embedding
-- index — zero new infra to stand up for a first cut. A pgvector embedding
-- column can be added later (see template-library/index.ts) without
-- changing that module's public retrieve() signature.
create table if not exists public.wybercode_templates (
  id                 uuid primary key default uuid_generate_v4(),
  archetype          text not null,        -- e.g. 'dashboard' | 'auth-login' | 'settings' | 'pricing' | 'list-detail' | ...
  framework          text not null,        -- 'react-web' | 'react-native'
  palette_id         text,                 -- optional design-token/palette match (see design-palettes.ts)
  description        text not null,        -- short natural-language description used for retrieval matching
  search_vector      tsvector generated always as (
                       to_tsvector('english', coalesce(description, '') || ' ' || coalesce(archetype, ''))
                     ) stored,
  gcs_bucket         text not null,
  gcs_path           text not null,        -- prefix; actual template files listed under this path
  wyber_ui_kit_parts text[] not null default '{}',
  source             text not null default 'seed', -- 'seed' (hand-curated) | 'promoted' (grown from a successful Claude-fallback build)
  quality_score       numeric,              -- optional automated score (vite-build-success rate, manual review, etc.)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.wybercode_templates enable row level security;
-- Service-role only (RLS on, no policies → anon/authenticated can't touch it).

create index if not exists idx_wybercode_templates_archetype on public.wybercode_templates(archetype);
create index if not exists idx_wybercode_templates_framework on public.wybercode_templates(framework);
create index if not exists idx_wybercode_templates_search on public.wybercode_templates using gin(search_vector);

-- Ranked search — the Supabase JS client's .textSearch() can't express
-- ts_rank ordering directly, so template-library/index.ts calls this RPC
-- instead. want_archetype is optional: pass null to search across all
-- archetypes (used as the second-pass, wider query when an exact-archetype
-- search comes back empty).
create or replace function search_wybercode_templates(
  query text,
  want_framework text,
  want_archetype text default null,
  limit_n int default 5
)
returns table (
  id uuid,
  archetype text,
  framework text,
  palette_id text,
  description text,
  gcs_bucket text,
  gcs_path text,
  wyber_ui_kit_parts text[],
  rank real
)
language sql
stable
as $$
  select
    t.id, t.archetype, t.framework, t.palette_id, t.description,
    t.gcs_bucket, t.gcs_path, t.wyber_ui_kit_parts,
    ts_rank(t.search_vector, websearch_to_tsquery('english', query)) as rank
  from public.wybercode_templates t
  where t.framework = want_framework
    and (want_archetype is null or t.archetype = want_archetype)
    and t.search_vector @@ websearch_to_tsquery('english', query)
  order by rank desc
  limit limit_n
$$;

-- Called only via the service-role admin client (template-library/index.ts);
-- RLS on the underlying table would return zero rows for anon/authenticated
-- anyway, but revoke the RPC itself too for defense in depth, same as
-- deduct_credits/adjust_credits above. Revoking from public ALSO revokes the
-- implicit grant service_role gets through PUBLIC, so it must be granted
-- back explicitly — this exact gap already bit deduct_credits/adjust_credits
-- once in production (see 20260703090000_grant_credit_fns_service_role.sql);
-- granted immediately here rather than repeating that as a follow-up fix.
revoke all on function search_wybercode_templates(text, text, text, int) from public;
revoke all on function search_wybercode_templates(text, text, text, int) from anon, authenticated;
grant execute on function search_wybercode_templates(text, text, text, int) to service_role;
