// Generate an image and PERSIST it to durable storage, returning a permanent
// public URL. This is the fix for the expiring-URL bug: DALL·E's `url` response
// format returns a link that dies in ~1h, so we request `b64_json` and upload the
// bytes to Supabase Storage ourselves. Used by the manual image panel and by the
// publish-time image-directive resolver. All failures return null so callers can
// fall back to a gradient — image generation is never allowed to break a build.

import type { SupabaseClient } from '@supabase/supabase-js'

export const GENERATED_IMAGES_BUCKET = 'generated-images'

export interface ImageGenOpts {
  /** gpt-image-1 transparent background (skipped on the dall-e-3 fallback) */
  transparent?: boolean
  /** skip the cache-hit check — always call the model */
  force?: boolean
  /** extra key discriminator (regen nonce / 'transparent') so a regenerate can
   *  never collide with the cached original and hand back the same image */
  variant?: string
}

/** Stable storage key so re-publishing the same prompt reuses one object.
 *  `variant` folds regen nonces / transparency into the hash — REGENERATE MUST
 *  VARY IT or the idempotent cache returns the old image. */
export function imageKey(scope: string, prompt: string, ratio: string, variant = ''): string {
  let h = 0
  const s = `${prompt}|${ratio}${variant ? `|${variant}` : ''}`
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `${scope}/${(h >>> 0).toString(36)}.png`
}

// gpt-image-1 supports a different size set than DALL·E-3 did — map our
// ratio sizes onto the nearest supported one.
const GPT_IMAGE_SIZES: Record<string, string> = {
  '1792x1024': '1536x1024',
  '1024x1792': '1024x1536',
  '1024x1024': '1024x1024',
}

/** Generate an image and return raw base64 PNG. null if unavailable.
 *
 * Primary: gpt-image-1 (returns b64 by default; the old `response_format`
 * parameter is REJECTED with a 400 "Unknown parameter" — this is why image
 * generation silently failed and every publish fell back to gradients).
 * Fallback: dall-e-3 without response_format (returns a ~1h temp URL, which
 * we download immediately). Failures are LOGGED, never thrown. */
export async function generateImageB64(prompt: string, size: string, opts?: ImageGenOpts): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) { console.error('[image-gen] OPENAI_API_KEY not set'); return null }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: GPT_IMAGE_SIZES[size] || '1536x1024',
        quality: 'medium',
        // Transparent background is a gpt-image-1-only feature; the dall-e-3
        // fallback below silently ignores the request (opaque image beats none).
        ...(opts?.transparent ? { background: 'transparent' } : {}),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const b64 = data?.data?.[0]?.b64_json
      if (b64) return b64
      console.error('[image-gen] gpt-image-1 returned no b64_json')
    } else {
      console.error('[image-gen] gpt-image-1 failed:', res.status, (await res.text()).slice(0, 300))
    }
  } catch (e) {
    console.error('[image-gen] gpt-image-1 threw:', e)
  }

  // Fallback: dall-e-3, url format (response_format is no longer accepted),
  // download the temp URL right away.
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size }),
    })
    if (!res.ok) {
      console.error('[image-gen] dall-e-3 fallback failed:', res.status, (await res.text()).slice(0, 300))
      return null
    }
    const data = await res.json()
    if (data?.data?.[0]?.b64_json) return data.data[0].b64_json
    const url = data?.data?.[0]?.url
    if (!url) { console.error('[image-gen] dall-e-3 returned neither b64 nor url'); return null }
    const img = await fetch(url)
    if (!img.ok) { console.error('[image-gen] temp-url download failed:', img.status); return null }
    return Buffer.from(await img.arrayBuffer()).toString('base64')
  } catch (e) {
    console.error('[image-gen] dall-e-3 fallback threw:', e)
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

/** Generate + persist in one step. Returns a permanent URL or null on any failure.
 *
 * IDEMPOTENT: the storage key is a stable hash of scope+prompt+ratio, and an
 * existing object is reused without calling OpenAI — so the preview, a rebuild,
 * and publish all share ONE generation per unique image. This is what makes
 * real images in the live preview affordable. */
export async function generateAndPersistImage(
  admin: SupabaseClient,
  prompt: string,
  size: string,
  scope: string,
  opts?: ImageGenOpts,
): Promise<string | null> {
  const variant = [opts?.variant, opts?.transparent ? 'transparent' : ''].filter(Boolean).join('|')
  const key = imageKey(scope, prompt, size, variant)

  // Cache hit → permanent URL already exists, zero cost. `force` (regenerate)
  // skips this — combined with a fresh variant nonce it guarantees a NEW image
  // at a NEW URL instead of the cached original.
  if (!opts?.force) {
    try {
      const { data } = admin.storage.from(GENERATED_IMAGES_BUCKET).getPublicUrl(key)
      if (data?.publicUrl) {
        const head = await fetch(data.publicUrl, { method: 'HEAD' })
        if (head.ok) return data.publicUrl
      }
    } catch { /* fall through to generation */ }
  }

  const b64 = await generateImageB64(prompt, size, opts)
  if (!b64) return null
  return persistImage(admin, b64, key)
}
