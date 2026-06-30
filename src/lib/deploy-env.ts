// Collects environment variables that should be injected into every Vercel
// deployment for a project. Two sources:
//
//  1. user_secrets  — manually-added keys (Stripe, OpenAI, etc.) stored
//     per-user, scoped across all their projects. The AI references these
//     as process.env.NAME in generated server code; injecting them here
//     makes the live deployment actually work rather than crash at runtime.
//
//  2. project_connectors (service='supabase') — the connected Supabase
//     project's anon key and URL. The AI already hardcodes these into
//     generated client code, but injecting them as env vars too lets any
//     server-side code (API routes, edge functions) pick them up from
//     process.env without needing the hardcoded values.
//
// Called once per deploy — runs server-side and never exposes decrypted
// values to the client.

import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'

export async function getDeployEnvVars(
  projectId: string,
  userId: string
): Promise<Record<string, string>> {
  const env: Record<string, string> = {}
  const admin = await createAdminClient()

  // 1. User secrets (per-user, cross-project)
  try {
    const { data: secrets } = await admin
      .from('user_secrets')
      .select('name, value_encrypted')
      .eq('user_id', userId)

    for (const s of secrets ?? []) {
      if (!s.name || !s.value_encrypted) continue
      try { env[s.name] = decrypt(s.value_encrypted) } catch {}
    }
  } catch {}

  // 2. Supabase connector (per-project)
  try {
    const { data: connector } = await admin
      .from('project_connectors')
      .select('api_key, config')
      .eq('project_id', projectId)
      .eq('service', 'supabase')
      .maybeSingle()

    if (connector) {
      const cfg = (connector.config ?? {}) as Record<string, string>
      if (cfg.url) {
        env['NEXT_PUBLIC_SUPABASE_URL'] = cfg.url
        env['VITE_SUPABASE_URL'] = cfg.url
      }
      if (connector.api_key) {
        try {
          const anonKey = decrypt(connector.api_key)
          env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = anonKey
          env['VITE_SUPABASE_ANON_KEY'] = anonKey
        } catch {}
      }
    }
  } catch {}

  return env
}
