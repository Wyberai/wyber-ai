import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM = process.env.VERCEL_TEAM_ID

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { projectId, subdomain } = await req.json()
    if (!subdomain) return NextResponse.json({ error: 'Subdomain required' }, { status: 400 })

    // Sanitize subdomain
    const clean = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
    const domain = `${clean}.wyberai.app`

    if (!VERCEL_TOKEN) {
      // Return mock for now
      return NextResponse.json({ domain, status: 'pending', message: 'Domain provisioning configured but token missing' })
    }

    // Add domain to Vercel project
    const teamQ = VERCEL_TEAM ? `?teamId=${VERCEL_TEAM}` : ''
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains${teamQ}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    // Save to DB
    await supabase.from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId)

    return NextResponse.json({ domain, status: 'active', vercelData: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
