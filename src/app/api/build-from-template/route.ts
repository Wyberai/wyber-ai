import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { templateId } = await req.json()
    if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

    const admin = await createAdminClient()

    // Get the template
    const { data: template, error: tErr } = await admin
      .from('prebuilt_apps')
      .select('name, description, category, files')
      .eq('id', templateId)
      .single()

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const prompt = `Build a ${template.name}. ${template.description || ''}`

    // Create project — use try/catch not .catch()
    const { data: project, error: pErr } = await admin
      .from('projects')
      .insert({
        user_id: user.id,
        name: template.name,
        framework: 'react-vite',
        files: template.files || {},
        first_prompt: prompt,
      })
      .select('id')
      .single()

    if (pErr || !project) {
      console.error('Project create error:', pErr)
      throw new Error(pErr?.message || 'Failed to create project')
    }

    // Increment use_count — fire and forget
    admin.rpc('increment_use_count', { template_id: templateId }).then(() => {}).catch(() => {})

    return NextResponse.json({ projectId: project.id, prompt })
  } catch (err: any) {
    console.error('build-from-template error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
