import { createBrowserClient } from '@supabase/ssr';

// Fallbacks keep static prerendering from crashing when the NEXT_PUBLIC_*
// env vars aren't present at build time (e.g. a Preview build missing them).
// Marketing/blog pages render <Navbar/>, which constructs this client; without
// the fallbacks createBrowserClient throws and the whole prerender fails.
// In the browser the real values are baked in at build time, so auth works
// normally — the placeholders only ever apply to an env-less build.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
