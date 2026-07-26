-- Speeds up `select count(*) from projects where files is not null`, now run
-- on every homepage request (src/lib/apps-built-stats.ts, cached 5 min
-- per-instance but still a real query on cold cache) — without this, that
-- count is a full sequential scan as the projects table grows.
create index if not exists idx_projects_has_files on projects (id) where files is not null;
