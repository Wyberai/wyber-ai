// Generate an image and PERSIST it to durable storage, returning a permanent
// public URL. This is the fix for the expiring-URL bug: DALL·E's `url` response
// format returns a link that dies in ~1h, so we request `b64_json` and upload the
// bytes to Supabase Storage ourselves. Used by the manual image panel and by the
// publish-time image-directive resolver. All failures return null so callers can
// fall back to a gradient — image generation is never allowed to break a build.

import type { SupabaseClient } from '@supabase/supabase-js'

export const GENERATED_IMAGES_BUCKET = 'generated-images'

export interface ImageGenOpts {
  /** gpt-image transparent background (skipped on the gpt-image-1 fallback) */
  transparent?: boolean
  /** skip the cache-hit check — always call the model */
  force?: boolean
  /** extra key discriminator (regen nonce / 'transparent') so a regenerate can
   *  never collide with the cached original and hand back the same image */
  variant?: string
  /** 'high' for the paid hero-quality regenerate path (ImagesPanel); every
   *  other caller (build-time placeholders, plain regenerate) stays 'medium'
   *  so the bulk of generation volume keeps the cheaper COGS. */
  quality?: 'medium' | 'high'
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
 * Primary: gpt-image-2 (gpt-image-1's replacement — gpt-image-1 retires
 * 2026-10-23 per OpenAI's deprecations page; returns b64 by default, the old
 * `response_format` parameter is REJECTED with a 400 "Unknown parameter").
 * Fallback: gpt-image-1 (dall-e-3 — the previous fallback — was already shut
 * down 2026-05-12 and would 400 every time; gpt-image-1 is still live until
 * its own retirement, so it's a real safety net again, not dead code. This
 * fallback itself needs re-pointing before Oct 2026.) Failures are LOGGED,
 * never thrown. */
export async function generateImageB64(prompt: string, size: string, opts?: ImageGenOpts): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) { console.error('[image-gen] OPENAI_API_KEY not set'); return null }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  const quality = opts?.quality || 'medium'

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt,
        n: 1,
        size: GPT_IMAGE_SIZES[size] || '1536x1024',
        quality,
        ...(opts?.transparent ? { background: 'transparent' } : {}),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const b64 = data?.data?.[0]?.b64_json
      if (b64) return b64
      console.error('[image-gen] gpt-image-2 returned no b64_json')
    } else {
      console.error('[image-gen] gpt-image-2 failed:', res.status, (await res.text()).slice(0, 300))
    }
  } catch (e) {
    console.error('[image-gen] gpt-image-2 threw:', e)
  }

  // Fallback: gpt-image-1, same b64 contract as the primary model.
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: GPT_IMAGE_SIZES[size] || '1536x1024',
        quality,
        ...(opts?.transparent ? { background: 'transparent' } : {}),
      }),
    })
    if (!res.ok) {
      console.error('[image-gen] gpt-image-1 fallback failed:', res.status, (await res.text()).slice(0, 300))
      return null
    }
    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) { console.error('[image-gen] gpt-image-1 fallback returned no b64_json'); return null }
    return b64
  } catch (e) {
    console.error('[image-gen] gpt-image-1 fallback threw:', e)
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

/** Result of a generate-or-reuse call. `wasGenerated` tells the caller whether
 *  a real (billable) OpenAI call actually happened, as opposed to a free
 *  cache-hit reusing an already-persisted image — callers that gate billing
 *  (resolve-directives, publish) need this to charge only for real generations. */
export interface GenerateAndPersistResult {
  url: string | null
  wasGenerated: boolean
}

/** Generate + persist in one step. Returns a permanent URL (or null on any
 * failure) plus whether a real generation happened.
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
): Promise<GenerateAndPersistResult> {
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
        if (head.ok) return { url: data.publicUrl, wasGenerated: false }
      }
    } catch { /* fall through to generation */ }
  }

  const b64 = await generateImageB64(prompt, size, opts)
  if (!b64) return { url: null, wasGenerated: false }
  const url = await persistImage(admin, b64, key)
  return { url, wasGenerated: url !== null }
}

/** After a real (billable) build-time generation — resolve-directives or
 * publish, never the manual regenerate route (that charges its own explicit
 * price upfront) — consume this project's one free image slot, or charge 1
 * credit if that slot is already used.
 *
 * Best-effort, same tradeoff the regenerate route already makes for its own
 * charge: never revoke an image the user is already looking at over a
 * billing failure. This fires for up to 8 directives in one parallel batch,
 * where pre-gating each one behind an upfront balance check isn't worth the
 * complexity for a ~$0.05 COGS line item — unlike regenerate, which is a
 * single explicit user action worth gating up front. */
export async function billBuildImage(admin: SupabaseClient, userId: string, projectId: string): Promise<{ free: boolean; charged: boolean }> {
  try {
    const { data: gotFreeSlot } = await admin.rpc('consume_free_image_slot', { p_project_id: projectId })
    if (gotFreeSlot) return { free: true, charged: false }
  } catch (e) {
    console.error('[image-billing] free-slot check failed:', e)
  }
  try {
    const { data: result } = await admin.rpc('deduct_credits', { p_user_id: userId, p_amount: 1 })
    const credits = result?.new_credits ?? null
    admin.from('credit_usage').insert({
      user_id: userId, amount: 1, reason: 'build-image-gen',
      credits_before: credits !== null ? credits + 1 : null, credits_after: credits,
    }).then(() => {}, () => {})
    return { free: false, charged: credits !== null }
  } catch (e) {
    console.error('[image-billing] charge failed (image already delivered):', e)
    return { free: false, charged: false }
  }
}
