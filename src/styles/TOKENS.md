# Which dark system owns which surface

WyberAi has three separate dark color-token systems. That's deliberate (each serves a different surface with different needs), but it's easy to reach for the wrong one — this doc is the map.

## 1. `src/app/globals.css` — `:root` / `[data-theme="dark"]`
`--bg`, `--card`, `--text`, `--sky`, etc. Supports a light/dark toggle.
**Owns:** marketing pages that can be viewed in light or dark mode — `/security`, `/about`, `/what-is-wyberai`, `/vs/lovable` (the older, non-space-journey pages).

## 2. IDE tokens — also in `src/app/globals.css` (`:root`, no toggle)
`--bg-base`, `--bg-surface`, `--bg-elevated`, `--ide-border`, `--ide-text`, `--accent`, `--ide-green/amber/red`. Always dark — no light variant exists or is planned.
**Owns:** the actual app chrome users work in every day: the editor (`src/components/editor/*`), and as of this overhaul, the dashboard (`src/components/dashboard/DashboardClient.tsx` and friends). This is the system to reach for when building new in-app (not marketing) UI.

## 3. `src/styles/brand.css` — `--brand-*`
`--brand-bg`, `--brand-accent`, `--brand-text`, starfield/film-grain textures ("space-journey"). Frozen, shared with the editor's own brand surfaces.
**Owns:** the homepage (`src/app/HomeClient.tsx`) and the newer `/vs` comparison pages (`VsPageTemplate.tsx`). This is the highest-production-value marketing system — reach for it on new top-of-funnel pages.

## The rule of thumb

- Building something the logged-in user lives in day to day (dashboard, editor, settings)? → **IDE tokens.**
- Building a new top-of-funnel marketing page? → **`brand.css`** (space-journey).
- Touching an existing light/dark-togglable marketing page? → stay in **`globals.css`**'s `:root`/`[data-theme="dark"]` system, don't introduce a fourth palette.

Full token unification across all three is a bigger initiative and deliberately out of scope here — this doc exists so nobody has to re-derive the boundary from scratch.
