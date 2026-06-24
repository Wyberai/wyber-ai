/**
 * Environment-variable validation.
 *
 * Previously a missing env var (e.g. SUPABASE_SERVICE_ROLE_KEY missing on a
 * Vercel Preview) only surfaced as an opaque crash deep inside a request — a
 * 500 with no hint of the real cause. This module enumerates what the app needs
 * and is run once at server startup (see src/instrumentation.ts) so the problem
 * is reported loudly and early, with the exact variable names.
 */

// Vars the core app cannot function without: auth, builder, credits/admin.
const CRITICAL = [
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

// Vars that gate specific features; absence degrades a feature, not the app.
const RECOMMENDED = [
  'SECRETS_ENCRYPTION_KEY', // connector secret encrypt/decrypt
  'NEXT_PUBLIC_APP_URL',    // absolute links, OG, emails
  'CRON_SECRET',            // protects cron endpoints
  'SUPABASE_OAUTH_CLIENT_ID',     // Supabase "Connect" OAuth flow
  'SUPABASE_OAUTH_CLIENT_SECRET', // Supabase "Connect" OAuth flow
] as const

export interface EnvReport {
  missingCritical: string[]
  missingRecommended: string[]
  ok: boolean
}

export function checkEnv(): EnvReport {
  const missing = (keys: readonly string[]) =>
    keys.filter(k => !process.env[k] || process.env[k]!.trim() === '')
  const missingCritical = missing(CRITICAL)
  const missingRecommended = missing(RECOMMENDED)
  return { missingCritical, missingRecommended, ok: missingCritical.length === 0 }
}

/**
 * Log the env report loudly. Does NOT throw — a hard crash at boot would take
 * down healthy routes too (e.g. a Preview missing only the service-role key can
 * still serve marketing pages). The prominent log is the "fail loudly" signal;
 * the routes that need a missing var already return clear 4xx/5xx JSON.
 */
export function reportEnv(): EnvReport {
  const report = checkEnv()
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  if (report.missingCritical.length > 0) {
    console.error(
      `\n🛑 [env] MISSING CRITICAL ENV VARS (${env}): ${report.missingCritical.join(', ')}\n` +
      `   The builder, auth, and credits will fail until these are set for this environment.\n`,
    )
  }
  if (report.missingRecommended.length > 0) {
    console.warn(`⚠ [env] Missing recommended env vars (${env}): ${report.missingRecommended.join(', ')}`)
  }
  if (report.ok && report.missingRecommended.length === 0) {
    console.log(`✓ [env] All required environment variables present (${env}).`)
  }
  return report
}
