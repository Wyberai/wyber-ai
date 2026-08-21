import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { templateFilesToProjectFiles } from '@/lib/template-to-project';

// POST /api/projects/from-template
// Creates a new project pre-loaded with a prebuilt template's files,
// so the editor opens with the template as the starting point.

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json();
    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
    }

    // The caller — never a client-supplied userId — owns the new project.
    // Previously this trusted `userId` off the request body, so anyone could
    // spawn projects inside any other account they named.
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    const { data: template, error: tErr } = await supabase
      .from('prebuilt_apps')
      .select('name, category, files')
      .eq('app_id', templateId)
      .single();

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const rawFiles = template.files || {};
    if (!rawFiles || Object.keys(rawFiles).length < 2) {
      return NextResponse.json({ error: 'Template has no files' }, { status: 422 });
    }

    // project_type drives MobileLayout vs IDELayout AND (via the client
    // store it hydrates into) which of the four system prompts governs every
    // EDIT made after loading the template — see build-from-template/route.ts
    // for the full explanation. WebApp-category templates want the generic
    // 'app' default on purpose (they're built to the real Web App spec).
    const category = (template.category as string) || '';
    const isMobile = category.startsWith('Mobile');
    const projectType = isMobile ? 'mobile'
      : category.startsWith('Website-') ? 'website'
      : category.startsWith('WebApp-') ? 'app'
      : 'saas';
    const normalized = isMobile
      ? Object.fromEntries(Object.entries(rawFiles as Record<string, any>).map(([p, v]) => {
          const path = p.replace(/^\.?\//, '');
          const content = typeof v === 'string' ? v : (v?.content ?? '');
          const ext = path.split('.').pop()?.toLowerCase() ?? '';
          const language = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', json: 'json' }[ext] ?? 'plaintext';
          return [path, { path, content, language }];
        }))
      : templateFilesToProjectFiles(rawFiles, template.name);

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        name: template.name || 'Untitled',
        framework: isMobile ? 'react-native' : 'react-vite',
        user_id: user.id,
        project_type: projectType,
        files: normalized,
        initial_prompt: '',
      })
      .select('id')
      .single();

    if (pErr || !project) {
      return NextResponse.json({ error: pErr?.message || 'Could not create project' }, { status: 500 });
    }

    // Seed a friendly first assistant message so the chat guides the user
    try {
      await supabase.from('project_messages').insert({
        project_id: project.id,
        role: 'assistant',
        content: `You've picked the **${template.name}** template. Take a look at the preview on the left and make it yours — change colors, add features, rename sections, anything.`,
      });
    } catch {}

    return NextResponse.json({ projectId: project.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
