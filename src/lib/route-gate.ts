// Top-level routes that need a signed-in user. The proxy used to send EVERY path that was not on its public allowlist
// to /login, including paths that do not exist: a mistyped URL such as /pricng, or a crawler probing /wp-admin, landed on
// a login wall (307) instead of a 404. Now only the routes below are gated; anything else falls through and Next.js
// answers 404. proxy-gate.test.ts fails if a new non-public top-level page directory is added without being listed
// here, so a protected page can never silently become public.
export const PROTECTED_TOP_LEVEL = [
  'admin', 'affiliate', 'agent', 'ai-employees', 'api-keys', 'clients', 'dashboard', 'go', 'gtm', 'maintenance',
  'onboarding', 'org', 'project', 'settings', 'vibe-cup', 'workflows',
] as const

/** True when the path's first segment is a known sign-in-only area. */
export function isProtectedPath(path: string): boolean {
  const first = (path || '/').split('/')[1] ?? ''
  return (PROTECTED_TOP_LEVEL as readonly string[]).includes(first)
}
