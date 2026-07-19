// PWA icon generation for published apps. Icons live next to the built HTML in
// the published-apps bucket ({projectId}/icon-{size}.png). Generated from the
// project thumbnail (640×360 JPEG, center-cropped square) when one exists,
// otherwise a deterministic brand-gradient letter-mark — so a first publish
// with no thumbnail still installs with a real icon.
//
// Two entry points:
//  - getOrCreateIcon: lazy, used by the icon-serving routes (always succeeds
//    with SOME icon; a bucket miss generates + caches on first request).
//  - warmPwaIcons: fire-and-forget at publish, regenerates (upsert) so a fresh
//    thumbnail is picked up on republish.
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'

// Callers pass service/admin clients with different Database generics —
// storage APIs are identical across them.
type AnySupabase = SupabaseClient<any, any, any>

export interface IconProject {
  id: string
  name: string | null
  thumbnail_url?: string | null
}

function letterMarkSvg(name: string, size: number): string {
  const letter = (name || 'A').trim().charAt(0).toUpperCase() || 'A'
  const fontSize = Math.round(size * 0.52)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="#ffffff">${letter}</text>
</svg>`
}

async function renderIcon(project: IconProject, size: number): Promise<Buffer> {
  if (project.thumbnail_url) {
    try {
      const res = await fetch(project.thumbnail_url)
      if (res.ok) {
        const src = Buffer.from(await res.arrayBuffer())
        return await sharp(src).resize(size, size, { fit: 'cover' }).png().toBuffer()
      }
    } catch {
      // fall through to letter-mark
    }
  }
  return await sharp(Buffer.from(letterMarkSvg(project.name || 'App', size))).png().toBuffer()
}

async function uploadIcon(admin: AnySupabase, projectId: string, size: number, png: Buffer) {
  await admin.storage
    .from('published-apps')
    .upload(`${projectId}/icon-${size}.png`, png, { contentType: 'image/png', upsert: true })
}

/** Serve-path entry: bucket hit → cached icon; miss → generate, cache, return. */
export async function getOrCreateIcon(
  admin: AnySupabase,
  project: IconProject,
  size: 192 | 512,
): Promise<Buffer> {
  const { data } = await admin.storage
    .from('published-apps')
    .download(`${project.id}/icon-${size}.png`)
  if (data) return Buffer.from(await data.arrayBuffer())
  const png = await renderIcon(project, size)
  uploadIcon(admin, project.id, size, png).catch(() => {}) // best-effort cache
  return png
}

/** Publish-path entry: regenerate both sizes (picks up new thumbnails). Best-effort. */
export async function warmPwaIcons(admin: AnySupabase, project: IconProject): Promise<void> {
  for (const size of [192, 512] as const) {
    try {
      const png = await renderIcon(project, size)
      await uploadIcon(admin, project.id, size, png)
    } catch (e) {
      console.warn(`[pwa] icon-${size} generation failed for ${project.id}:`, String(e))
    }
  }
}
