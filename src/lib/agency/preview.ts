import { randomBytes } from 'node:crypto'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { scanForExposedSecrets } from '@/lib/security-scan'
import { runSmokeTest } from '@/lib/smoke-test'
import { injectComments } from '@/lib/feedback/comment-snippet'
import type { Db } from './access'

// A private, updatable preview of a client's project: the latest SAVED version, built the same way publishing builds it,
// but with none of publishing's side effects (it does not go public, set a published address, bill image generation or
// touch the live site). The built page is kept in storage under a path that contains the secret token, and is only ever
// served by /preview/<token>, inside a sandboxed frame.

export const BUCKET = 'published-apps'
const BUILDER = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com'

export const makePreviewToken = (): string => `pv_${randomBytes(24).toString('base64url')}`
export const isPreviewToken = (t: unknown): t is string => typeof t === 'string' && /^pv_[A-Za-z0-9_-]{30,60}$/.test(t)
export const previewPath = (token: string): string => `previews/${token}/index.html`

export type PreviewBuild = { ok: true } | { ok: false; status: number; error: string }

export interface PreviewDeps {
  fetchImpl?: typeof fetch
  smoke?: typeof runSmokeTest
}

/** Builds a web project's saved files into a standalone page and stores it for the token. */
export async function buildWebPreview(
  db: Db & { storage: { from: (b: string) => { upload: (path: string, body: string, opts: Record<string, unknown>) => Promise<{ error: unknown }> } } },
  project: { id: string; files: unknown; feedback_mode_enabled?: boolean | null },
  token: string,
  deps: PreviewDeps = {},
): Promise<PreviewBuild> {
  const f = deps.fetchImpl ?? fetch
  const smoke = deps.smoke ?? runSmokeTest
  const files = (project.files ?? {}) as Record<string, unknown>
  if (Object.keys(files).length === 0) return { ok: false, status: 409, error: 'Nothing has been built in this project yet.' }

  // Image directives that have not been generated yet resolve to a gradient here (sanitizeFiles), exactly as the first
  // publish would. Previews never generate or bill images.
  const sanitized = sanitizeFiles(files as never, { appId: project.id })
  const secrets = scanForExposedSecrets(sanitized)
  if (!secrets.ok) {
    return { ok: false, status: 400, error: `Preview blocked: exposed secret detected (${secrets.findings.map(x => `${x.name} in ${x.file}`).join('; ')}). Remove it first.` }
  }

  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 120_000)
  let res: Response
  try {
    res = await f(`${BUILDER}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: sanitized, projectId: project.id }), signal: ctl.signal })
  } catch (e) {
    return (e as { name?: string })?.name === 'AbortError'
      ? { ok: false, status: 504, error: 'The build server is starting up. Try again in a moment.' }
      : { ok: false, status: 502, error: 'The build server could not be reached. Try again in a moment.' }
  } finally { clearTimeout(timer) }

  let data: { url?: string; error?: string } = {}
  try { data = await res.json() } catch { /* handled below */ }
  if (!res.ok || !data.url) return { ok: false, status: 502, error: (data.error || '').trim() || 'The app could not be built. Open it in the builder, fix the error, and try again.' }

  const html = await (await f(data.url)).text()
  const baseUrl = data.url.replace('/index.html', '')
  let page = html
    .replace(/src="\.\/assets\//g, `src="${baseUrl}/assets/`)
    .replace(/href="\.\/assets\//g, `href="${baseUrl}/assets/`)
    .replace(/from "\.\/assets\//g, `from "${baseUrl}/assets/`)
  // Pinned comments only when the freelancer switched them on for this project.
  if (project.feedback_mode_enabled) page = injectComments(page, { projectId: project.id, publicPath: '/preview' })

  const check = await smoke(page, baseUrl)
  if (!check.ok) return { ok: false, status: 422, error: `The preview came out blank or broken (${check.error}). Open it in the builder and fix it first.` }

  const { error } = await db.storage.from(BUCKET).upload(previewPath(token), page, { contentType: 'text/html', upsert: true })
  if (error) return { ok: false, status: 500, error: 'Could not store the preview. Try again.' }
  return { ok: true }
}

/** Removes a stored preview. Best effort: a missing file is not an error. */
export async function removePreviewFile(db: { storage: { from: (b: string) => { remove: (paths: string[]) => Promise<unknown> } } }, token: string | null | undefined): Promise<void> {
  if (!token) return
  try { await db.storage.from(BUCKET).remove([previewPath(token)]) } catch { /* nothing to remove */ }
}
