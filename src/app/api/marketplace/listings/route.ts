import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/marketplace/listings
// Lists one of the caller's own projects for sale. Snapshots the project's
// current files at submission time — later edits to the project don't
// retroactively change what a buyer already purchased or is about to. Starts
// `pending`: it's invisible on /marketplace until an admin approves it
// (mirrors the community_templates.is_approved moderation gate), so nobody
// can self-publish straight to the public grid.
export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as {
      projectId?: string; title?: string; description?: string; category?: string; priceUsd?: number
    }
    const { projectId, title, description, category } = body
    const priceUsd = Number(body.priceUsd)

    if (!projectId || !title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'projectId, title, description, and category are required' }, { status: 400 })
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 1) {
      return NextResponse.json({ error: 'priceUsd must be at least $1' }, { status: 400 })
    }

    const db = createServiceClient()

    // Ownership check — never trust a client-supplied projectId without it.
    const { data: project, error: projErr } = await db
      .from('projects')
      .select('id, user_id, name, framework, files')
      .eq('id', projectId)
      .single()
    if (projErr || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (project.user_id !== user.id) return NextResponse.json({ error: 'You can only list your own projects' }, { status: 403 })
    if (!project.files || Object.keys(project.files).length < 2) {
      return NextResponse.json({ error: 'This project has no source to sell yet — build it out first' }, { status: 422 })
    }

    const { data: listing, error: insertErr } = await db
      .from('marketplace_listings')
      .insert({
        seller_id: user.id,
        project_id: project.id,
        source: 'user',
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        framework: project.framework || 'react-vite',
        files: project.files,
        price_usd: priceUsd,
        status: 'pending',
      })
      .select('id, status')
      .single()

    if (insertErr || !listing) {
      return NextResponse.json({ error: insertErr?.message || 'Could not create listing' }, { status: 500 })
    }

    return NextResponse.json({ listingId: listing.id, status: listing.status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET /api/marketplace/listings?mine=1 — the caller's own listings (any
// status), for the "your submissions" view on /marketplace/sell.
export async function GET(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('marketplace_listings')
    .select('id, title, category, price_usd, status, sales_count, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ listings: data ?? [] })
}
