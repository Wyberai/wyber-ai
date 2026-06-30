import { describe, it, expect } from 'vitest'
import { scanForExposedSecrets } from './security-scan'

// A real Supabase service-role JWT shape: header.payload.signature, where the
// payload's base64 contains the literal `"role":"service_role"` claim.
const fakeServiceRoleJwt = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ role: 'service_role', iss: 'supabase', iat: 1700000000 })).toString('base64url')
  return `${header}.${payload}.fakesignaturefakesignaturefakesignature`
}

// A real anon-key shape — same JWT structure, different role claim — must NOT trigger.
const fakeAnonJwt = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ role: 'anon', iss: 'supabase', iat: 1700000000 })).toString('base64url')
  return `${header}.${payload}.fakesignaturefakesignaturefakesignature`
}

describe('scanForExposedSecrets', () => {
  it('flags a service-role JWT embedded in client code', () => {
    const result = scanForExposedSecrets({
      'src/lib/supabase.ts': { content: `export const supabase = createClient(url, '${fakeServiceRoleJwt()}')` },
    })
    expect(result.ok).toBe(false)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].name).toBe('Supabase service-role key')
    expect(result.findings[0].file).toBe('src/lib/supabase.ts')
  })

  it('does NOT flag a normal anon key', () => {
    const result = scanForExposedSecrets({
      'src/lib/supabase.ts': { content: `export const supabase = createClient(url, '${fakeAnonJwt()}')` },
    })
    expect(result.ok).toBe(true)
    expect(result.findings).toHaveLength(0)
  })

  it('flags an AWS access key', () => {
    const result = scanForExposedSecrets({
      'src/config.ts': { content: `const KEY = 'AKIAABCDEFGHIJKLMNOP'` },
    })
    expect(result.ok).toBe(false)
    expect(result.findings[0].name).toBe('AWS access key')
  })

  it('flags a Stripe live secret key', () => {
    const result = scanForExposedSecrets({
      'src/payments.ts': { content: `const STRIPE_KEY = 'sk_live_${'a'.repeat(24)}'` },
    })
    expect(result.ok).toBe(false)
    expect(result.findings[0].name).toBe('Stripe secret key')
  })

  it('flags a PEM private key block', () => {
    const result = scanForExposedSecrets({
      'src/cert.ts': { content: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----' },
    })
    expect(result.ok).toBe(false)
    expect(result.findings[0].name).toBe('Generic private key block')
  })

  it('handles plain-string file values, not just {content} objects', () => {
    const result = scanForExposedSecrets({
      'src/config.ts': `const KEY = 'AKIAABCDEFGHIJKLMNOP'`,
    } as any)
    expect(result.ok).toBe(false)
  })

  it('passes a clean project with no findings', () => {
    const result = scanForExposedSecrets({
      'src/App.tsx': { content: 'export default function App() { return <div>hello</div> }' },
      'package.json': { content: '{"name":"app"}' },
    })
    expect(result.ok).toBe(true)
    expect(result.findings).toHaveLength(0)
  })

  it('ignores empty/missing files object', () => {
    expect(scanForExposedSecrets({}).ok).toBe(true)
  })
})
