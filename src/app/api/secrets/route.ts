import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encrypt, mask, decrypt } from '@/lib/secrets-crypto'

// GET /api/secrets — list secret names + masked previews, never plaintext
export async function GET() {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('user_secrets')
      .select('id, name, value_encrypted, created_at, updated_at')
      .eq('user_id', user.id)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const secrets = (data ?? []).map(row => {
      let preview = '••••••••'
      try {
        preview = mask(decrypt(row.value_encrypted))
      } catch (e) {
        // Every row here has a real stored value, so a decrypt failure means
        // the encryption key was rotated or the ciphertext is corrupt — not
        // "no value set". The old fallback preview ('••••••••') is identical
        // to what a perfectly healthy secret would never show but looks the
        // same as a generic placeholder, so users had no reason to suspect
        // anything was wrong until whatever used the secret failed elsewhere.
        console.error(`[secrets] failed to decrypt secret "${row.name}" (user ${user.id}):`, String(e))
        preview = '⚠ decrypt error — re-save this secret'
      }
      return { id: row.id, name: row.name, preview, created_at: row.created_at, updated_at: row.updated_at }
    })

    return NextResponse.json({ secrets })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/secrets — create or update (upsert by name)
export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, value } = await req.json() as { name?: string; value?: string }
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!value?.trim()) return NextResponse.json({ error: 'value is required' }, { status: 400 })

    const normalizedName = name.trim().toUpperCase().replace(/\s+/g, '_')
    const value_encrypted = encrypt(value.trim())
    const now = new Date().toISOString()

    const admin = await createAdminClient()
    const { error } = await admin
      .from('user_secrets')
      .upsert(
        { user_id: user.id, name: normalizedName, value_encrypted, updated_at: now },
        { onConflict: 'user_id,name' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, name: normalizedName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/secrets — remove by name
export async function DELETE(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await req.json() as { name?: string }
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const admin = await createAdminClient()
    const { error } = await admin
      .from('user_secrets')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
