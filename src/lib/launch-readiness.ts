// Launch-readiness scanner — the GTM trust differentiator, sibling to
// rls-scan.ts (which proves a live DB isn't leaking) and security-scan.ts
// (which proves no secret shipped to the client).
//
// This one asks a different question: "is this app actually ready to put in
// front of real customers?" WyberAi's published apps are client-rendered React
// bundles served from a single srcDoc iframe (see src/app/app/[slug]/page.tsx)
// — there is no server route for "/privacy" or "/terms" to crawl, and body
// content never appears in a raw HTTP fetch (it only exists after the bundle
// executes in a browser). So unlike the public seo-audit tool (which crawls an
// arbitrary external URL because that's all it has), this scanner reads the
// project's OWN source directly. For a deterministic CSR app the shipped text
// IS what will render — there's no server branching to diverge from — so
// pattern-matching the real source is ground truth, not a guess, the same way
// scanForExposedSecrets() reads source directly rather than guessing at it.
//
// Deliberately advisory, never a publish gate: unlike a proven RLS leak, a
// placeholder-content match is a heuristic with real false-positive risk.

export type ReadinessSeverity = 'critical' | 'high' | 'medium' | 'good'

export interface ReadinessCheck {
  id: string
  label: string
  severity: ReadinessSeverity
  detail: string
  fix?: string
}

export interface ReadinessReport {
  scannedAt: string
  score: number // 0-100
  checks: ReadinessCheck[]
  passed: number
  total: number
}

type FileVal = { content?: string; language?: string } | string

const fileContent = (v: FileVal | undefined): string =>
  v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

const WEIGHT: Record<Exclude<ReadinessSeverity, 'good'>, number> = { critical: 22, high: 12, medium: 6 }

const LEGAL_SIGNAL = /(privacy policy|terms of service|terms and conditions|terms of use)/i

const PLACEHOLDER_TEXT =
  /(lorem ipsum|\{\{\s*\w+\s*\}\}|\[your company\]|\[company name\]|company name here|insert (?:company|your) name|TODO:?\s*(?:replace|add|write)|placeholder text|your (?:company|business) name)/i

const PLACEHOLDER_EMAIL = /\b[\w.+-]+@(?:example|yourcompany|yourdomain|test|company|acme)\.(?:com|org|io)\b/i

const PLACEHOLDER_IMAGE_HOST = /(via\.placeholder\.com|placehold\.it|placekitten\.com|placeimg\.com)/i

const STOCK_NAME = /\b(?:john|jane)\s+doe\b/i

/** Flatten every file's text into one blob — cheap, and good enough for regex-level checks (no cheerio/AST dep, same philosophy as seo-audit.ts). */
export function joinAllText(files: Record<string, FileVal>): string {
  return Object.values(files || {}).map(fileContent).join('\n')
}

export function checkLegalPages(allText: string): ReadinessCheck {
  if (!LEGAL_SIGNAL.test(allText)) {
    return {
      id: 'legal',
      label: 'Privacy & Terms',
      severity: 'high',
      detail: 'No privacy policy or terms of service found anywhere in the app.',
      fix: 'Add a Privacy Policy and Terms of Service — most payment processors and app stores require them before launch.',
    }
  }
  return { id: 'legal', label: 'Privacy & Terms', severity: 'good', detail: 'Privacy policy / terms content found.' }
}

export function checkContactMethod(allText: string): ReadinessCheck {
  const mailto = allText.match(/mailto:([^"'\s)]+)/i)?.[1]
  const hasForm = /<form\b/i.test(allText) && /contact/i.test(allText)
  const hasTel = /\btel:\+?[0-9]/i.test(allText)

  if (mailto && PLACEHOLDER_EMAIL.test(mailto)) {
    return {
      id: 'contact',
      label: 'Contact method',
      severity: 'critical',
      detail: `Contact email is a placeholder ("${mailto}") — real visitors can't reach you.`,
      fix: 'Replace the placeholder email with a real inbox you monitor.',
    }
  }
  if (!mailto && !hasForm && !hasTel) {
    return {
      id: 'contact',
      label: 'Contact method',
      severity: 'high',
      detail: 'No email, contact form, or phone number found — visitors have no way to reach you.',
      fix: 'Add a real contact email, form, or phone number, typically in the footer.',
    }
  }
  return { id: 'contact', label: 'Contact method', severity: 'good', detail: 'A real contact method was found.' }
}

export function checkPlaceholderContent(allText: string): ReadinessCheck[] {
  const checks: ReadinessCheck[] = []
  if (PLACEHOLDER_TEXT.test(allText)) {
    checks.push({
      id: 'placeholder-text',
      label: 'Placeholder content',
      severity: 'critical',
      detail: 'Found unfinished placeholder text (e.g. "Lorem ipsum", "[Your Company]") still in the shipped app.',
      fix: 'Search your files for the flagged placeholder text and replace it with real copy.',
    })
  }
  if (PLACEHOLDER_IMAGE_HOST.test(allText)) {
    checks.push({
      id: 'placeholder-image',
      label: 'Placeholder images',
      severity: 'high',
      detail: 'Found placeholder image hosts (e.g. via.placeholder.com) — these are slow, sometimes rate-limited, and look unfinished.',
      fix: 'Replace placeholder image URLs with real generated or uploaded images (see the Images tab).',
    })
  }
  if (STOCK_NAME.test(allText)) {
    checks.push({
      id: 'stock-name',
      label: 'Stock testimonial names',
      severity: 'medium',
      detail: 'Found generic placeholder names ("John Doe"/"Jane Doe") — often left over in testimonials or examples.',
      fix: 'Replace with a real customer name and quote, or remove the testimonial until you have one.',
    })
  }
  if (checks.length === 0) {
    checks.push({ id: 'placeholder-clean', label: 'Placeholder content', severity: 'good', detail: 'No obvious placeholder or hallucinated content found.' })
  }
  return checks
}

/**
 * Cross-references React Router <Route path="..."> definitions against every
 * internal href/to target in the source. A footer link to a page that was
 * never actually built is a common, very real bug class in generated apps —
 * and unlike live-crawling, this is checkable with 100% precision from source.
 */
export function findBrokenInternalLinks(files: Record<string, FileVal>): ReadinessCheck {
  const allText = joinAllText(files)

  const routePaths = new Set<string>(
    Array.from(allText.matchAll(/<Route\s[^>]*\bpath\s*=\s*["']([^"']+)["']/g)).map((m) => m[1]),
  )
  routePaths.add('/')

  const targets = new Set<string>(
    Array.from(allText.matchAll(/\b(?:href|to)\s*=\s*["'](\/[a-zA-Z0-9_\-/]*)["']/g))
      .map((m) => m[1])
      .filter((p) => p !== '/' && !p.startsWith('//')),
  )

  if (targets.size === 0) {
    return { id: 'nav', label: 'Internal navigation', severity: 'good', detail: 'No multi-page navigation to check.' }
  }

  const broken = Array.from(targets).filter((t) => {
    if (routePaths.has(t)) return false
    for (const r of routePaths) {
      if (r.includes(':') && t.startsWith(r.split(':')[0])) return false
    }
    return true
  })

  if (broken.length > 0) {
    return {
      id: 'nav',
      label: 'Internal navigation',
      severity: broken.length > 2 ? 'high' : 'medium',
      detail: `${broken.length} internal link(s) point to a page that doesn't exist: ${broken.slice(0, 5).join(', ')}.`,
      fix: 'Add the missing route(s), or fix the link to point at a real page.',
    }
  }
  return { id: 'nav', label: 'Internal navigation', severity: 'good', detail: 'All internal links resolve to a defined route.' }
}

/** Bundles the already-computed RLS score into one line item — only shown when a scan actually exists, so apps with no backend aren't nagged. */
export function checkSecurityScore(score: number | undefined): ReadinessCheck | null {
  if (score === undefined) return null
  if (score < 85) {
    return {
      id: 'security',
      label: 'Data security',
      severity: 'high',
      detail: `Your last security scan scored ${score}/100 — see the Security tab for findings.`,
      fix: 'Fix the flagged RLS issues before launch.',
    }
  }
  return { id: 'security', label: 'Data security', severity: 'good', detail: `Database security scan is clean (${score}/100).` }
}

export function scoreChecks(checks: ReadinessCheck[]): number {
  let score = 100
  for (const c of checks) if (c.severity !== 'good') score -= WEIGHT[c.severity]
  return Math.max(0, Math.min(100, score))
}

function rank(s: ReadinessSeverity): number {
  return s === 'critical' ? 3 : s === 'high' ? 2 : s === 'medium' ? 1 : 0
}

/**
 * A single yes/no answer to "is the CODE clean?" — deliberately narrower than
 * "is this ready to launch" (that also needs pricing, positioning, support
 * staffing, and a marketing plan — see launch-checklist.ts for that half,
 * which is self-certified because it's a human judgment call, not a code
 * property). Mirrors the RLS gate's own logic (zero criticals is the
 * non-negotiable bar) plus the score threshold already used for the
 * green/amber/red coloring in the UI. Neither number is derived from real
 * launch-outcome data — it's a reasonable starting default, worth
 * recalibrating once there's enough published-app history to correlate score
 * against real outcomes.
 */
export function isLaunchReady(report: ReadinessReport): boolean {
  return report.score >= 85 && !report.checks.some((c) => c.severity === 'critical')
}

export function scanLaunchReadiness(
  files: Record<string, FileVal>,
  opts: { securityScore?: number } = {},
): ReadinessReport {
  const allText = joinAllText(files)
  const checks: ReadinessCheck[] = [
    checkLegalPages(allText),
    checkContactMethod(allText),
    ...checkPlaceholderContent(allText),
    findBrokenInternalLinks(files),
  ]
  const sec = checkSecurityScore(opts.securityScore)
  if (sec) checks.push(sec)

  return {
    scannedAt: new Date().toISOString(),
    score: scoreChecks(checks),
    checks: checks.sort((a, b) => rank(b.severity) - rank(a.severity)),
    passed: checks.filter((c) => c.severity === 'good').length,
    total: checks.length,
  }
}
