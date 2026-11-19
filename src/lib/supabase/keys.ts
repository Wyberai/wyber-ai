// Supabase is replacing the legacy `anon` and `service_role` keys (JWTs) with publishable (`sb_publishable_...`) and secret
// (`sb_secret_...`) keys by the end of 2026. Both kinds work side by side today. These helpers read the new variable first and fall
// back to the old one, so setting NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY switches us over with no code change.
// Source: https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
//
// The new keys are not JWTs. They go in the `apikey` header; sending one as `Authorization: Bearer` is not supported, so raw REST calls
// must use supabaseRestHeaders() instead of building the Bearer header by hand.

/** Browser-safe key (publishable, or the legacy anon key). Reference the variables literally so Next.js inlines them. */
export function publicSupabaseKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

/** Server-only key (secret, or the legacy service_role key). Never import this into client code. */
export function secretSupabaseKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
}

/** Legacy keys are JWTs (three dot-separated parts); the new keys are short opaque strings. */
export function isJwtKey(key: string): boolean {
  return key.split('.').length === 3
}

/** Headers for a raw PostgREST/Auth call made with a project key (ours or a customer's). */
export function supabaseRestHeaders(key: string): Record<string, string> {
  return isJwtKey(key) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key }
}
