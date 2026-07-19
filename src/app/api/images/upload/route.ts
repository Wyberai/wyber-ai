import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GENERATED_IMAGES_BUCKET } from '@/lib/generate-image-persist'
import { rateLimit } from '@/lib/rate-limit'

// Upload the user's own image into the generated-images bucket and return a
// permanent public URL — the Images panel swaps it into the project source.
// Free (no model call), but rate-limited and size-capped like everything else.

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB decoded
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(`img-upload:${user.id}`, 30, 10 * 60 * 1000)
    if (!limited.allowed) return NextResponse.json({ error: 'Too many uploads — try again in a few minutes.' }, { status: 429 })

    const { projectId, b64, mimeType } = await req.json()
    if (!projectId || !b64 || typeof b64 !== 'string') {
      return NextResponse.json({ error: 'projectId and b64 are required' }, { status: 400 })
    }
    const ext = ALLOWED_TYPES[String(mimeType)]
    if (!ext) return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })

    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const bytes = Buffer.from(b64, 'base64')
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 8 MB' }, { status: 413 })
    }

    const admin = createServiceClient()
    try { await admin.storage.createBucket(GENERATED_IMAGES_BUCKET, { public: true }) } catch { /* exists */ }
    const key = `${projectId}/upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await admin.storage.from(GENERATED_IMAGES_BUCKET).upload(key, bytes, { contentType: String(mimeType), upsert: false })
    if (error) return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 })

    const { data } = admin.storage.from(GENERATED_IMAGES_BUCKET).getPublicUrl(key)
    if (!data?.publicUrl) return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 })
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('[img-upload] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
