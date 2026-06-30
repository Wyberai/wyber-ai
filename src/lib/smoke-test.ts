// Lightweight post-build validation. The remote builder only reports success
// when `buildData.url` exists, which just means *something* got written to
// disk — a broken import or runtime error can still ship as a "successful"
// build with a blank page. This catches that class of failure before we tell
// the user the app is published.

const ERROR_SIGNATURES = [
  'Cannot find module',
  'SyntaxError',
  'Unexpected token',
  'ReferenceError',
  'is not defined',
  'Application error',
  'Uncaught Error',
  'Failed to fetch dynamically imported module',
  'Module not found',
]

export interface SmokeTestResult {
  ok: boolean
  error?: string
}

export async function runSmokeTest(html: string, baseUrl: string): Promise<SmokeTestResult> {
  if (!html || html.trim().length === 0) {
    return { ok: false, error: 'Build produced an empty page' }
  }

  if (!/<div[^>]*id=["']root["']/i.test(html)) {
    return { ok: false, error: 'Build output is missing the app root element' }
  }

  for (const sig of ERROR_SIGNATURES) {
    if (html.includes(sig)) {
      return { ok: false, error: `Build output contains an unhandled error: "${sig}"` }
    }
  }

  // Verify the JS bundle(s) the page actually loads are reachable — a build
  // that emits index.html but fails to bundle assets still passes the checks
  // above (the error never reaches the HTML).
  const scriptSrcs = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)).map(m => m[1])
  for (const src of scriptSrcs.slice(0, 5)) {
    const assetUrl = src.startsWith('http') ? src : `${baseUrl}/${src.replace(/^\.?\//, '')}`
    try {
      const res = await fetch(assetUrl, { method: 'HEAD' })
      if (!res.ok) return { ok: false, error: `Bundle asset unreachable: ${src} (${res.status})` }
    } catch {
      return { ok: false, error: `Bundle asset unreachable: ${src}` }
    }
  }

  return { ok: true }
}
