import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/secrets-crypto'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()

    const { data, error } = await admin
      .from('cloud_secrets')
      .select('id, key, created_at, updated_at')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[cloud/secrets] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch secrets' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[cloud/secrets] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, key, value } = await req.json()

    if (!projectId || !key || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const encrypted = encrypt(value)

    const { data, error } = await admin
      .from('cloud_secrets')
      .insert({
        wyber_project_id: projectId,
        user_id: user.id,
        key,
        value: encrypted
      })
      .select('id, key, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create secret' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[cloud/secrets] POST Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, value } = await req.json()

    if (!id || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Verify ownership
    const { data: secret } = await admin
      .from('cloud_secrets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!secret) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
    }

    const encrypted = encrypt(value)

    const { data, error } = await admin
      .from('cloud_secrets')
      .update({ value: encrypted, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, key, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update secret' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[cloud/secrets] PUT Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const admin = await createAdminClient()

    // Verify ownership
    const { data: secret } = await admin
      .from('cloud_secrets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!secret) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
    }

    const { error } = await admin
      .from('cloud_secrets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete secret' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cloud/secrets] DELETE Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
