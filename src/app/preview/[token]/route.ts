import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hit } from '@/lib/agency/limits'
import { requestIp } from '@/lib/agency/portal'
import { isUnlocked, unlockCookieName } from '@/lib/agency/passcode'
import { loadAgencyProfile } from '@/lib/agency/profile'
import { BUCKET, isPreviewToken, previewPath } from '@/lib/agency/preview'
import { previewMessagePage, webPreviewPage } from '@/lib/agency/preview-page'
import { mobileSharePage } from '@/lib/rnw-preview/share-page'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// A client's private preview link: /preview/<token>. The token is the access. The link works only while the client is
// active and the preview is switched on, and, when the freelancer locked the client's page with a passcode, only in a
// browser that has already unlocked it (so a forwarded preview link cannot bypass the passcode).
function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
    },
  })
}

const GONE = () => html(previewMessagePage('This preview is not available', 'The link may have been switched off or replaced. Ask whoever sent it for a new one.'), 404)

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isPreviewToken(token)) return GONE()
  if (!(await hit(`preview-view:${requestIp(req)}`, 120, 10 * 60_000))) return html(previewMessagePage('Slow down', 'Too many requests. Try again in a few minutes.'), 429)

  const db = createServiceClient()
  const { data: del } = await db.from('client_deliverables').select('id, client_id, project_id, preview_built_at').eq('preview_token', token).eq('preview_enabled', true).maybeSingle()
  if (!del) return GONE()

  const { data: client } = await db.from('clients').select('id, owner_id, org_id, slug, status, portal_passcode_hash').eq('id', del.client_id).maybeSingle()
  if (!client || client.status !== 'active') return GONE()

  if (!isUnlocked(client.slug, client.portal_passcode_hash, req.cookies.get(unlockCookieName(client.slug))?.value)) {
    // No slug in this message: someone holding only the preview link must not learn the address of the client's page.
    return html(previewMessagePage('This preview is protected', 'Open the project page you were sent, enter the passcode there, then use the Preview link on that page.'), 401)
  }

  const { data: project } = await db.from('projects').select('name, files, project_type').eq('id', del.project_id).maybeSingle()
  if (!project) return GONE()

  if (project.project_type === 'mobile') {
    const page = await mobileSharePage(project)
    return html(page.html, page.status)
  }

  const { data: file } = await db.storage.from(BUCKET).download(previewPath(token))
  if (!file) return html(previewMessagePage('This preview is not ready yet', 'It has not been built, or is being updated. Try again in a minute, or ask for an update.'), 404)

  const business = (await loadAgencyProfile(db, { owner_id: client.owner_id, org_id: client.org_id }))?.business_name ?? null
  return html(webPreviewPage({ name: project.name, business, builtAt: del.preview_built_at, inner: await file.text() }))
}
