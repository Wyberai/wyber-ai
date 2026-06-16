import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Auth: only the project owner may export
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, format } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const supabase = createServiceClient();
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)   // ownership check — service client used only after this gate
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (format === 'json') {
    // Return all project data as JSON
    const { data: generations } = await supabase
      .from('generations')
      .select('prompt, files_changed, created_at, credits_used')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        framework: project.framework,
        files: project.files,
        created_at: project.created_at,
        updated_at: project.updated_at,
        deployed_url: project.deployed_url,
        github_repo: project.github_repo,
      },
      generations: generations ?? [],
      exportedAt: new Date().toISOString(),
      note: 'This export contains all your project files and generation history. Your data belongs to you.',
    });
  }

  if (format === 'zip') {
    // Return files as a ZIP-compatible structure
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add all project files
    const files = project.files as Record<string, { content: string }>;
    for (const [path, file] of Object.entries(files)) {
      zip.file(path, file.content);
    }

    // Add a README
    zip.file('WYBER_EXPORT.md', `# ${project.name}

Exported from WyberAi on ${new Date().toLocaleDateString()}

## Framework
${project.framework}

## Files
${Object.keys(files).join('\n')}

## Running locally
\`\`\`bash
npm install
npm run dev
\`\`\`

Your code belongs to you. No WyberAi dependency required to run this app.
`);

    const buffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }));

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '-')}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
