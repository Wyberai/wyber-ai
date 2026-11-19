-- Agency mode: shareable previews. A freelancer can give a client a private link to the latest saved version of a
-- project (without publishing it), update it whenever they like, and switch it off. One link per project per client.
-- Additive only. Re-runnable.
--
-- The link is /preview/<preview_token>. The token is random and unguessable; it is the only access to the preview, so
-- turning it off or making a new one stops the old link working at once. For web projects the built page is stored in
-- the existing "published-apps" bucket under previews/<preview_token>/index.html (the token is part of the path, so the
-- object cannot be found without it).

alter table public.client_deliverables
  add column if not exists preview_token text,
  add column if not exists preview_enabled boolean not null default false,
  add column if not exists preview_built_at timestamptz;

create unique index if not exists client_deliverables_preview_token_key
  on public.client_deliverables (preview_token)
  where preview_token is not null;
