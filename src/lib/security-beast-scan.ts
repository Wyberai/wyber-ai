// "Security Beast" scan — a comprehensive, deterministic checklist run
// against the project's actual generated files. Distinct from rls-scan.ts
// (which proves a live Supabase DB isn't leaking via a real unauthenticated
// network probe) and security-scan.ts (exposed-secrets regex scan, reused
// here as one check among many) — this is the broader "would a
// security-minded reviewer flag this code" pass: hardcoded keys, XSS, SQLi,
// CORS, rate limiting, admin-route auth, cookie/session handling, webhook
// signature verification, plaintext passwords. Every check reads the
// project's real source directly — no LLM guessing, same philosophy as
// launch-readiness.ts and seo/scan/route.ts.

import { scanForExposedSecrets } from './security-scan'

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type CheckSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface BeastCheck {
  id: string
  label: string
  status: CheckStatus
  severity: CheckSeverity
  detail: string
}

export interface BeastScanReport {
  score: number
  checks: BeastCheck[]
  scannedAt: string
  // Auto-generated fixes for the checks that are safe to fix mechanically
  // (no code judgment required) — path -> full new file content. Everything
  // else (secrets, auth gaps, SQLi, etc.) needs a real code change and is
  // deliberately left to "Fix with AI" instead of being rewritten blind.
  fixedFiles?: Record<string, string>
  fixedCheckIds?: string[]
}

type FileVal = { content?: string; language?: string } | string
const fileContent = (v: FileVal | undefined): string => (v == null ? '' : typeof v === 'string' ? v : (v.content ?? ''))

// Single source of truth for the checklist's id/label/order — imported by
// both this engine (so every produced check matches a known id) and the UI
// (to render the full "here's what we'll check" list before the scan runs).
export const SECURITY_BEAST_CHECKLIST: { id: string; label: string }[] = [
  { id: 'secrets', label: 'No hardcoded API keys or secrets' },
  { id: 'env-file', label: 'No committed .env with real secrets' },
  { id: 'client-env-leak', label: 'Server secrets kept out of the client bundle' },
  { id: 'cors', label: "CORS isn't wide open to '*'" },
  { id: 'rate-limit', label: 'API routes have rate limiting' },
  { id: 'xss', label: 'Protected against XSS (dangerouslySetInnerHTML)' },
  { id: 'eval', label: 'No eval() / new Function() usage' },
  { id: 'sql-injection', label: 'No SQL built by string concatenation' },
  { id: 'admin-auth', label: 'Admin routes require authentication' },
  { id: 'security-headers', label: 'Security headers configured' },
  { id: 'secure-cookies', label: 'Cookies marked httpOnly & secure' },
  { id: 'token-storage', label: 'Auth tokens kept out of localStorage' },
  { id: 'plaintext-password', label: 'Passwords never stored in plaintext' },
  { id: 'webhook-signature', label: 'Webhooks verify their signature' },
  { id: 'debug-artifacts', label: 'No debug leftovers (stray logs, debugger statements)' },
  { id: 'file-upload', label: 'File uploads validate type & size' },
]

// Only for the checks the scan does NOT already fix mechanically (security-
// headers and debug-artifacts get a real code edit written automatically —
// see buildSecurityHeadersFix/stripDebugArtifacts below). Everything here
// needs code judgment specific to the flagged file(s), so "Fix with AI" (and
// "Apply all fixes") sends the model there instead of a blind template edit.
export const SECURITY_FIX_PROMPTS: Record<string, string> = {
  secrets: 'Remove the hardcoded API keys/secrets flagged by the security scan — move each one to an environment variable (never NEXT_PUBLIC_-prefixed) and update every place that used the hardcoded value to read from process.env instead.',
  'env-file': 'A committed .env file has real-looking secret values. Move those values out of the repo — replace them with placeholders in .env.example and make sure the real values are only ever set as actual environment variables, never committed.',
  'client-env-leak': 'A server-only environment variable is being read from client-side code. Move that logic into a server-only file or API route, and have the client call that route instead of reading the env var directly.',
  cors: "Replace the wide-open CORS policy (Access-Control-Allow-Origin: '*') with a specific allowed origin (or a small allowlist) appropriate for this app.",
  'rate-limit': 'Add rate limiting to this app\'s API routes so a single endpoint can\'t be hammered with unlimited requests.',
  xss: 'Every use of dangerouslySetInnerHTML is rendering unsanitized content. Add a sanitizer (e.g. DOMPurify) and sanitize the HTML before it\'s rendered.',
  eval: 'Remove the eval()/new Function() usage flagged by the security scan and replace it with a safe, non-dynamic equivalent.',
  'sql-injection': 'Rewrite the raw SQL built by string concatenation/template interpolation to use parameterized queries instead.',
  'admin-auth': 'Add an authentication check (matching the pattern already used elsewhere in this app) to the admin route(s) that currently have none.',
  'secure-cookies': 'Add the httpOnly and secure flags to the session/auth cookie(s) that are missing them.',
  'token-storage': 'Move the auth/session token currently stored in localStorage into an httpOnly cookie instead.',
  'plaintext-password': 'Add password hashing (bcrypt or argon2) before the password field is written, instead of storing it in plaintext.',
  'webhook-signature': "Add signature verification to the webhook route(s) that currently accept a payload with no check — verify against that provider's actual signing method before trusting the request.",
  'file-upload': 'Add file type and size validation to the file-upload route(s) that currently have none.',
}

const SEVERITY_WEIGHT: Record<CheckSeverity, number> = { critical: 18, high: 10, medium: 5, low: 2 }

const labelFor = (id: string): string => SECURITY_BEAST_CHECKLIST.find(c => c.id === id)?.label ?? id

function mk(id: string, status: CheckStatus, severity: CheckSeverity, detail: string): BeastCheck {
  return { id, label: labelFor(id), status, severity, detail }
}

const isApiFile = (p: string) => /\/api\//.test(p) || p.startsWith('api/')
const isServerOnlyFile = (p: string) => isApiFile(p) || /\.server\.(ts|tsx|js)$/.test(p) || /^(lib|server)\//.test(p)
const isClientFile = (p: string) => /\.(tsx|jsx)$/.test(p) && !isServerOnlyFile(p)

const SECURITY_HEADERS_BLOCK = `  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },`

/**
 * Only returns a fix when it can be applied with confidence. When next.config
 * exists but doesn't match one of the common export shapes, this returns null
 * rather than guessing at a string-surgery insertion point — a corrupted
 * config would break every route, which is worse than leaving the check as a
 * manual "Fix with AI" item.
 */
function buildSecurityHeadersFix(nextConfigEntry: [string, FileVal] | undefined): { path: string; content: string } | null {
  if (!nextConfigEntry) {
    return {
      path: 'next.config.js',
      content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n${SECURITY_HEADERS_BLOCK}\n}\n\nmodule.exports = nextConfig\n`,
    }
  }
  const [path, val] = nextConfigEntry
  const content = fileContent(val)
  if (/async\s+headers\s*\(\s*\)/.test(content)) return null
  const patterns = [/(module\.exports\s*=\s*\{)/, /(const\s+nextConfig\s*=\s*\{)/, /(export\s+default\s*\{)/]
  for (const p of patterns) {
    if (p.test(content)) return { path, content: content.replace(p, `$1\n${SECURITY_HEADERS_BLOCK}`) }
  }
  return null
}

/**
 * Purely subtractive — only removes lines that are exactly a stray
 * `debugger;` statement or a `console.log(...)` of a secret-looking value.
 * Safe by construction: nothing load-bearing is ever a bare `debugger;` line,
 * and if a line doesn't match one of these two shapes exactly, it's left
 * alone rather than risking a partial/incorrect edit.
 */
function stripDebugArtifacts(files: Record<string, FileVal>): Record<string, string> {
  const fixed: Record<string, string> = {}
  for (const [path, v] of Object.entries(files)) {
    const content = fileContent(v)
    if (!content) continue
    let updated = content.replace(/^[ \t]*debugger;[ \t]*\r?\n/gm, '')
    updated = updated.replace(/^[ \t]*console\.log\([^)]*\b(password|secret|apikey|api_key|token)\b[^)]*\);?[ \t]*\r?\n/gim, '')
    if (updated !== content) fixed[path] = updated
  }
  return fixed
}

export function runSecurityBeastScan(files: Record<string, FileVal>): BeastScanReport {
  const entries = Object.entries(files || {})
  const allText = entries.map(([, v]) => fileContent(v)).join('\n')
  const checks: BeastCheck[] = []

  // 1. Hardcoded secrets — reuses the existing exposed-secrets scanner.
  const secretScan = scanForExposedSecrets(files)
  checks.push(secretScan.ok
    ? mk('secrets', 'pass', 'critical', 'No hardcoded API keys, tokens, or connection strings found in your source.')
    : mk('secrets', 'fail', 'critical', `Found ${secretScan.findings.length} hardcoded secret(s): ${secretScan.findings.slice(0, 3).map(f => `${f.name} in ${f.file}`).join(', ')}${secretScan.findings.length > 3 ? `, +${secretScan.findings.length - 3} more` : ''}.`))

  // 2. .env committed with real-looking secret values.
  const envFiles = entries.filter(([p]) => /(^|\/)\.env(\.\w+)?$/.test(p))
  const envWithSecrets = envFiles.filter(([, v]) => {
    const c = fileContent(v)
    return /=\s*[^\s"'`]{8,}/.test(c) && !/^.*=\s*(your[_-]?\w*|xxx+|changeme|placeholder|example)\s*$/im.test(c)
  })
  checks.push(envWithSecrets.length === 0
    ? mk('env-file', 'pass', 'critical', 'No .env file with real-looking values is committed to the project.')
    : mk('env-file', 'fail', 'critical', `${envWithSecrets.map(([p]) => p).join(', ')} is committed with real-looking values — this ships to anyone who can read the published bundle.`))

  // 3. Server-only env vars referenced from client-side files.
  const clientLeaks: string[] = []
  for (const [p, v] of entries) {
    if (!isClientFile(p)) continue
    for (const m of fileContent(v).matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      if (!/^(NEXT_PUBLIC_|VITE_|REACT_APP_)/.test(m[1]) && m[1] !== 'NODE_ENV') clientLeaks.push(`${m[1]} in ${p}`)
    }
  }
  checks.push(clientLeaks.length === 0
    ? mk('client-env-leak', 'pass', 'critical', 'No server-only environment variables are referenced from client-side files.')
    : mk('client-env-leak', 'fail', 'critical', `Server-only env var referenced from client code: ${clientLeaks.slice(0, 3).join(', ')}${clientLeaks.length > 3 ? `, +${clientLeaks.length - 3} more` : ''} — this bundles the value into JS shipped to the browser.`))

  // 4. CORS wide open.
  const corsWildcard = /(Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*|origin\s*:\s*['"]\*['"])/i.test(allText)
  checks.push(corsWildcard
    ? mk('cors', 'fail', 'high', "Found a CORS policy allowing origin '*' — any website can call your API using a logged-in user's credentials.")
    : mk('cors', 'pass', 'high', "No wide-open CORS ('*') policy found."))

  // 5. Rate limiting.
  const apiRoutes = entries.filter(([p]) => isApiFile(p))
  const hasRateLimit = /(rate-?limit|@upstash\/ratelimit|express-rate-limit)/i.test(allText)
  checks.push(apiRoutes.length === 0
    ? mk('rate-limit', 'pass', 'medium', 'No API routes to rate-limit.')
    : hasRateLimit
      ? mk('rate-limit', 'pass', 'medium', 'Rate-limiting logic was found in the project.')
      : mk('rate-limit', 'warn', 'medium', `${apiRoutes.length} API route(s) found with no rate-limiting logic anywhere in the project — a single endpoint can be hammered at no cost to the caller.`))

  // 6. XSS via dangerouslySetInnerHTML.
  const dsihFiles = entries.filter(([, v]) => /dangerouslySetInnerHTML/.test(fileContent(v)))
  const hasSanitizer = /(DOMPurify|sanitize-html|sanitizeHtml)/i.test(allText)
  checks.push(dsihFiles.length === 0
    ? mk('xss', 'pass', 'high', 'No dangerouslySetInnerHTML usage found.')
    : hasSanitizer
      ? mk('xss', 'pass', 'high', `dangerouslySetInnerHTML is used in ${dsihFiles.length} file(s), but a sanitizer (DOMPurify/sanitize-html) is present in the project.`)
      : mk('xss', 'fail', 'high', `dangerouslySetInnerHTML used in ${dsihFiles.map(([p]) => p).slice(0, 3).join(', ')} with no HTML sanitizer found — unsanitized user content here is a stored-XSS risk.`))

  // 7. eval / new Function.
  const evalFiles = entries.filter(([, v]) => /(\beval\s*\(|new\s+Function\s*\()/.test(fileContent(v)))
  checks.push(evalFiles.length === 0
    ? mk('eval', 'pass', 'high', 'No eval() or new Function() usage found.')
    : mk('eval', 'fail', 'high', `eval()/new Function() found in ${evalFiles.map(([p]) => p).slice(0, 3).join(', ')} — executing dynamic code from any untrusted input here is a code-injection risk.`))

  // 8. SQL injection via string concatenation.
  const sqlConcatFiles = entries.filter(([, v]) => {
    const c = fileContent(v)
    return /(query|execute|raw)\s*\(\s*(`[^`]*\$\{|['"][^'"]*['"]\s*\+)/i.test(c) && /(select|insert|update|delete)\s/i.test(c)
  })
  checks.push(sqlConcatFiles.length === 0
    ? mk('sql-injection', 'pass', 'critical', 'No raw SQL built by string concatenation or template interpolation found.')
    : mk('sql-injection', 'fail', 'critical', `Raw SQL built from a template/concatenated string found in ${sqlConcatFiles.map(([p]) => p).slice(0, 3).join(', ')} — use parameterized queries instead of interpolating values directly.`))

  // 9. Admin routes without an auth check.
  const adminFiles = entries.filter(([p]) => isApiFile(p) && /\/admin\//i.test(p))
  const AUTH_SIGNAL = /(getUser\s*\(|auth\.getSession|requireAuth|requireAdmin|getServerSession|session\?\.\w)/
  const unprotectedAdmin = adminFiles.filter(([, v]) => !AUTH_SIGNAL.test(fileContent(v)))
  checks.push(adminFiles.length === 0
    ? mk('admin-auth', 'pass', 'critical', 'No admin API routes found.')
    : unprotectedAdmin.length === 0
      ? mk('admin-auth', 'pass', 'critical', `All ${adminFiles.length} admin route(s) check for an authenticated session.`)
      : mk('admin-auth', 'fail', 'critical', `${unprotectedAdmin.map(([p]) => p).slice(0, 3).join(', ')} looks like an admin route with no auth check found — anyone with the URL could call it.`))

  // 10. Security headers in next.config.
  const nextConfigEntry = entries.find(([p]) => /next\.config\.(js|ts|mjs)$/.test(p))
  const configText = nextConfigEntry ? fileContent(nextConfigEntry[1]) : ''
  const hasHeadersFn = /async\s+headers\s*\(\s*\)/.test(configText)
  const hasKeyHeader = /(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security|X-Content-Type-Options)/i.test(configText)
  checks.push(hasHeadersFn && hasKeyHeader
    ? mk('security-headers', 'pass', 'medium', 'next.config sets security headers (X-Frame-Options/CSP/HSTS or similar).')
    : mk('security-headers', 'warn', 'medium', nextConfigEntry ? 'next.config has no headers() function setting security headers (X-Frame-Options, CSP, etc).' : 'No next.config file found to check for security headers.'))

  // 11. Secure cookies on anything token/session/auth-shaped.
  const cookieSetCalls = Array.from(allText.matchAll(/\.set\(\s*['"]([\w.-]*(?:token|session|auth|jwt)[\w.-]*)['"][\s\S]{0,200}?\)/gi))
  const insecureCookies = cookieSetCalls.filter(m => !/httpOnly/i.test(m[0]) || !/secure/i.test(m[0]))
  checks.push(cookieSetCalls.length === 0
    ? mk('secure-cookies', 'pass', 'high', 'No auth/session cookies are set directly in the code (or none were found to check).')
    : insecureCookies.length === 0
      ? mk('secure-cookies', 'pass', 'high', 'Auth/session cookies found are marked httpOnly and secure.')
      : mk('secure-cookies', 'warn', 'high', `${insecureCookies.length} cookie(s) that look session/auth-related are missing httpOnly or secure — they can be read by client-side JS or sent over plain HTTP.`))

  // 12. Auth tokens in localStorage.
  const tokenInLocalStorage = /localStorage\.setItem\(\s*['"][^'"]*(token|auth|jwt|session)[^'"]*['"]/i.test(allText)
  checks.push(tokenInLocalStorage
    ? mk('token-storage', 'warn', 'high', 'An auth/session/token value is stored in localStorage — readable by any script on the page (a real risk if an XSS ever slips through). An httpOnly cookie is safer.')
    : mk('token-storage', 'pass', 'high', 'No auth tokens found being stored in localStorage.'))

  // 13. Plaintext passwords (skip if the app delegates to Supabase Auth).
  const usesSupabaseAuth = /supabase\.auth\.(signUp|signInWithPassword|admin\.createUser)/.test(allText)
  const plaintextPasswordFiles = entries.filter(([, v]) => {
    const c = fileContent(v)
    if (!/\b(insert|update|upsert)\b[\s\S]{0,300}?\bpassword\s*:/i.test(c)) return false
    if (/password_hash|hashed_password/i.test(c)) return false
    if (/(bcrypt|argon2|scrypt|crypto\.hash|createHash)/i.test(c)) return false
    return true
  })
  checks.push(usesSupabaseAuth || plaintextPasswordFiles.length === 0
    ? mk('plaintext-password', 'pass', 'critical', usesSupabaseAuth ? 'Passwords are handled by Supabase Auth, not stored directly.' : 'No plaintext password storage found.')
    : mk('plaintext-password', 'fail', 'critical', `A password field is written directly (no hashing call nearby) in ${plaintextPasswordFiles.map(([p]) => p).slice(0, 3).join(', ')}.`))

  // 14. Webhook signature verification.
  const webhookFiles = entries.filter(([p]) => isApiFile(p) && /webhook/i.test(p))
  const SIGNATURE_SIGNAL = /(constructEvent|verifyWebhookSignature|createHmac|timingSafeEqual|stripe-signature|x-signature|verify\w*signature)/i
  const unverifiedWebhooks = webhookFiles.filter(([, v]) => !SIGNATURE_SIGNAL.test(fileContent(v)))
  checks.push(webhookFiles.length === 0
    ? mk('webhook-signature', 'pass', 'critical', 'No webhook routes found.')
    : unverifiedWebhooks.length === 0
      ? mk('webhook-signature', 'pass', 'critical', `All ${webhookFiles.length} webhook route(s) verify a signature before trusting the payload.`)
      : mk('webhook-signature', 'fail', 'critical', `${unverifiedWebhooks.map(([p]) => p).slice(0, 3).join(', ')} accepts a webhook with no signature verification found — anyone can forge a request to it.`))

  // 15. Debug leftovers.
  const hasDebuggerStatement = /\bdebugger;/.test(allText)
  const logsSecret = /console\.log\([^)]*\b(password|secret|apikey|api_key|token)\b[^)]*\)/i.test(allText)
  checks.push(!hasDebuggerStatement && !logsSecret
    ? mk('debug-artifacts', 'pass', 'low', 'No stray debugger statements or logs of secret-looking values found.')
    : mk('debug-artifacts', 'warn', 'low', [hasDebuggerStatement && 'a debugger; statement', logsSecret && 'a console.log of a secret-looking value'].filter(Boolean).join(' and ') + ' were found — clean these up before shipping to production.'))

  // 16. File upload validation.
  const uploadFiles = entries.filter(([p, v]) => isApiFile(p) && /(formData\(\)|multer|upload)/i.test(fileContent(v)))
  const VALIDATION_SIGNAL = /(\.type\s*[=!]==?|allowedTypes|mimetype|MAX_FILE_SIZE|\.size\s*[<>])/i
  const unvalidatedUploads = uploadFiles.filter(([, v]) => !VALIDATION_SIGNAL.test(fileContent(v)))
  checks.push(uploadFiles.length === 0
    ? mk('file-upload', 'pass', 'medium', 'No file-upload handling found.')
    : unvalidatedUploads.length === 0
      ? mk('file-upload', 'pass', 'medium', `All ${uploadFiles.length} file-upload route(s) validate type/size.`)
      : mk('file-upload', 'warn', 'medium', `File-upload route(s) with no visible type/size validation: ${unvalidatedUploads.map(([p]) => p).slice(0, 3).join(', ')}.`))

  let score = 100
  for (const c of checks) if (c.status !== 'pass') score -= SEVERITY_WEIGHT[c.severity]
  score = Math.max(0, Math.min(100, score))

  // Only these two checks are safe to fix mechanically — see the module
  // comment on each helper for why the rest (secrets, auth, SQLi, etc.) are
  // deliberately left for "Fix with AI" instead of being rewritten blind.
  const fixedFiles: Record<string, string> = {}
  const fixedCheckIds: string[] = []

  const securityHeadersCheck = checks.find(c => c.id === 'security-headers')
  if (securityHeadersCheck && securityHeadersCheck.status !== 'pass') {
    const fix = buildSecurityHeadersFix(nextConfigEntry)
    if (fix) { fixedFiles[fix.path] = fix.content; fixedCheckIds.push('security-headers') }
  }

  const debugArtifactsCheck = checks.find(c => c.id === 'debug-artifacts')
  if (debugArtifactsCheck && debugArtifactsCheck.status !== 'pass') {
    const stripped = stripDebugArtifacts(files)
    if (Object.keys(stripped).length > 0) {
      Object.assign(fixedFiles, stripped)
      fixedCheckIds.push('debug-artifacts')
    }
  }

  return { score, checks, scannedAt: new Date().toISOString(), fixedFiles, fixedCheckIds }
}
