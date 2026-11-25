import { describe, it, expect, afterEach, vi } from 'vitest'
import { isJwtKey, publicSupabaseKey, secretSupabaseKey, supabaseRestHeaders } from './keys'

afterEach(() => { vi.unstubAllEnvs() })

describe('key selection', () => {
  it('prefers the new variables and falls back to the legacy ones', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'legacy-service')
    expect(publicSupabaseKey()).toBe('legacy-anon')
    expect(secretSupabaseKey()).toBe('legacy-service')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_y')
    expect(publicSupabaseKey()).toBe('sb_publishable_x')
    expect(secretSupabaseKey()).toBe('sb_secret_y')
  })
  it('returns nothing usable when no key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(publicSupabaseKey()).toBeFalsy()
  })
})

describe('raw REST headers', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.c2ln'
  it('sends legacy JWT keys as apikey plus Bearer, as before', () => {
    expect(isJwtKey(jwt)).toBe(true)
    expect(supabaseRestHeaders(jwt)).toEqual({ apikey: jwt, Authorization: `Bearer ${jwt}` })
  })
  it('sends new keys on the apikey header only', () => {
    const k = 'sb_publishable_abc123'
    expect(isJwtKey(k)).toBe(false)
    expect(supabaseRestHeaders(k)).toEqual({ apikey: k })
  })
})
