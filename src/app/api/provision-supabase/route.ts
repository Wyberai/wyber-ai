import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_MGMT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN
const SUPABASE_ORG_ID = process.env.SUPABASE_ORG_ID

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    if (!SUPABASE_MGMT_TOKEN || !SUPABASE_ORG_ID) {
      return NextResponse.json({ error: 'Supabase provisioning not configured' }, { status: 503 })
    }

    const { projectId, projectName } = await req.json()

    // Create a new Supabase project via Management API
    const dbPassword = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18)
    const projectSlug = `wyber-${user.id.slice(0, 8)}-${Date.now().toString(36)}`

    const createRes = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_MGMT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Wyber - ${projectName || 'My App'}`,
        organization_id: SUPABASE_ORG_ID,
        plan: 'free',
        region: 'us-east-1',
        db_pass: dbPassword,
        desired_instance_size: 'micro',
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      return NextResponse.json({ error: `Provisioning failed: ${err}` }, { status: 500 })
    }

    const project = await createRes.json()

    // Save to our DB
    await supabase.from('supabase_projects').insert({
      wyber_project_id: projectId,
      user_id: user.id,
      supabase_project_id: project.id,
      supabase_url: `https://${project.id}.supabase.co`,
      anon_key: project.anon_key,
      service_key: project.service_role_key,
      db_password: dbPassword,
      status: 'provisioning',
    })

    return NextResponse.json({
      supabaseUrl: `https://${project.id}.supabase.co`,
      anonKey: project.anon_key,
      projectId: project.id,
      status: 'provisioning',
      message: 'Supabase project created! Ready in ~30 seconds.',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
