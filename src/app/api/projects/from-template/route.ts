import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/projects/from-template
// Creates a new project pre-loaded with a prebuilt template's files,
// so the editor opens with the template as the starting point.
export async function POST(req: NextRequest) {
  try {
    const { templateId, userId } = await req.json();
    if (!templateId || !userId) {
      return NextResponse.json({ error: 'Missing templateId or userId' }, { status: 400 });
    }
    const supabase = createServiceClient();

    // Fetch the template
    const { data: template, error: tErr } = await supabase
      .from('prebuilt_apps')
      .select('name, category, files')
      .eq('app_id', templateId)
      .single();

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const files = template.files || {};
    if (!files || Object.keys(files).length < 2) {
      return NextResponse.json({ error: 'Template has no files' }, { status: 422 });
    }

    // Create a new project pre-loaded with the template files
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        name: template.name || 'Untitled',
        framework: 'react-vite',
        user_id: userId,
        project_type: 'app',
        files,
        initial_prompt: '',
      })
      .select('id')
      .single();

    if (pErr || !project) {
      return NextResponse.json({ error: pErr?.message || 'Could not create project' }, { status: 500 });
    }

    return NextResponse.json({ projectId: project.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
