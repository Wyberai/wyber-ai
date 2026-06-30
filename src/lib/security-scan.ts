// Scans generated project files for secrets that should never leave the
// server: a Supabase anon key is public-by-design (RLS is the real boundary),
// but a service-role key or other high-privilege credential embedded in
// client code is a full database compromise. This runs before publish/export
// so we catch it before it reaches a user's browser.

type FileVal = { content?: string; language?: string } | string

const fileContent = (v: FileVal | undefined): string =>
  v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

// Supabase service-role JWTs carry `"role":"service_role"` in the (base64)
// payload segment — detect the literal substring rather than fully decoding,
// since the encoded form is deterministic for that claim.
const SERVICE_ROLE_JWT = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]*(?:c2VydmljZV9yb2xl|InNlcnZpY2Vfcm9sZSI)[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+/

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Supabase service-role key', pattern: SERVICE_ROLE_JWT },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic private key block', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Stripe secret key', pattern: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: 'OpenAI/Anthropic-style secret key', pattern: /\b(sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9-]{20,})\b/ },
]

export interface SecurityScanResult {
  ok: boolean
  findings: { file: string; name: string }[]
}

export function scanForExposedSecrets(files: Record<string, FileVal>): SecurityScanResult {
  const findings: { file: string; name: string }[] = []
  for (const [path, val] of Object.entries(files || {})) {
    const content = fileContent(val)
    if (!content) continue
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) findings.push({ file: path, name })
    }
  }
  return { ok: findings.length === 0, findings }
}
