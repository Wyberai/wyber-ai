-- Snapshot of the most recent publish-time security scan, so the badge/verify
-- page (Phase 4) can render without re-deriving it from security_scans.
-- show_security_badge defaults FALSE: the badge is a visible product decision
-- on a customer's own published app, and should be something they turn ON
-- (once a settings toggle exists), not something that silently appears.

alter table public.projects
  add column if not exists show_security_badge boolean not null default false,
  add column if not exists last_security_score int,
  add column if not exists last_security_scanned_at timestamptz;
