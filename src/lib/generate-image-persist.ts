// Generate an image and PERSIST it to durable storage, returning a permanent
// public URL. This is the fix for the expiring-URL bug: DALL·E's `url` response
// format returns a link that dies in ~1h, so we request `b64_json` and upload the
// bytes to Supabase Storage ourselves. Used by the manual image panel and by the
// publish-time image-directive resolver. All failures return null so callers can
// fall back to a gradient — image generation is never allowed to break a build.

import type { SupabaseClient } from '@supabase/supabase-js'

export const GENERATED_IMAGES_BUCKET = 'generated-images'

/** Stable storage key so re-publishing the same prompt reuses one object. */
export function imageKey(scope: string, prompt: string, ratio: string): string {
  let h = 0
  const s = `${prompt}|${ratio}`
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `${scope}/${(h >>> 0).toString(36)}.png`
}

/** Call DALL·E and return raw base64 PNG (no temp URL). null if unavailable. */
export async function generateImageB64(prompt: string, size: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, response_format: 'b64_json' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.[0]?.b64_json ?? null
  } catch {
    return null
  }
}

/** Upload base64 PNG bytes to the public bucket; return a permanent URL or null. */
export async function persistImage(
  admin: SupabaseClient,
  b64: string,
  key: string,
): Promise<string | null> {
  try {
    const bytes = Buffer.from(b64, 'base64')
    // Best-effort bucket create (no-op/error if it already exists).
    try { await admin.storage.createBucket(GENERATED_IMAGES_BUCKET, { public: true }) } catch { /* exists */ }
    const { error } = await admin.storage
      .from(GENERATED_IMAGES_BUCKET)
      .upload(key, bytes, { contentType: 'image/png', upsert: true })
    if (error) return null
    const { data } = admin.storage.from(GENERATED_IMAGES_BUCKET).getPublicUrl(key)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

/** Generate + persist in one step. Returns a permanent URL or null on any failure. */
export async function generateAndPersistImage(
  admin: SupabaseClient,
  prompt: string,
  size: string,
  scope: string,
): Promise<string | null> {
  const b64 = await generateImageB64(prompt, size)
  if (!b64) return null
  return persistImage(admin, b64, imageKey(scope, prompt, size))
}
