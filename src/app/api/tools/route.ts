import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encryptCredential, decryptCredential, maskCredential } from '@/lib/encryption'
import { getToolById } from '@/lib/tool-registry'

// GET — list connected tools for a project
export async function GET(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('project_connectors')
      .select('service, config, connected_at')
      .eq('project_id', projectId)
      .eq('user_id', user.id)

    if (error) throw error

    // Return masked credentials only — never expose raw keys
    const masked = (data || []).map(row => ({
      tool_id: row.service,
      tool: getToolById(row.service),
      connected_at: row.connected_at,
      credentials: Object.fromEntries(
        Object.entries(row.config || {}).map(([k, v]) => [k, maskCredential(String(v))])
      ),
    }))

    return NextResponse.json({ tools: masked })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — connect a tool with encrypted credentials
export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, toolId, credentials } = await req.json()
    if (!projectId || !toolId || !credentials) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tool = getToolById(toolId)
    if (!tool) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    // Validate required credentials
    const missing = tool.credentials
      .filter(f => f.required && !credentials[f.key]?.trim())
      .map(f => f.label)
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    // Encrypt each credential value
    const encryptedConfig: Record<string, string> = {}
    for (const [key, value] of Object.entries(credentials)) {
      if (value && String(value).trim()) {
        encryptedConfig[key] = await encryptCredential(String(value).trim())
      }
    }

    const admin = await createAdminClient()
    const { error } = await admin
      .from('project_connectors')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        service: toolId,
        api_key: null, // encrypted keys are in config
        config: encryptedConfig,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'project_id,service' })

    if (error) throw error

    return NextResponse.json({ success: true, tool_id: toolId, masked: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — disconnect a tool
export async function DELETE(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, toolId } = await req.json()
    const admin = await createAdminClient()
    await admin.from('project_connectors')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('service', toolId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
