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
    const { data: template } = await admin
      .from('prebuilt_apps')
      .select('name, description, category, files')
      .eq('id', templateId)
      .single()

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    // Build the prompt from template
    const prompt = `Build a ${template.name}. ${template.description || ''}`

    // Create a new project
    const { data: project, error } = await admin
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

    if (error || !project) throw error || new Error('Failed to create project')

    // Increment use_count on template
    try { await admin.rpc('increment_use_count', { template_id: templateId }) } catch {}

    return NextResponse.json({ projectId: project.id, prompt })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
