import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

const SUPPORTED_EXTS = new Set([
  'ts','tsx','js','jsx','css','html','json','md','vue','svg','env','example','txt'
]);

const SKIP_PATHS = ['node_modules', '.git', '.next', 'dist', 'build', '.DS_Store'];

function shouldSkip(path: string) {
  return SKIP_PATHS.some(s => path.includes(s));
}

function inferLanguage(ext: string): string {
  const map: Record<string,string> = {
    ts:'typescript', tsx:'typescript', js:'javascript', jsx:'javascript',
    css:'css', html:'html', json:'json', md:'markdown', vue:'vue', svg:'xml',
  };
  return map[ext] ?? 'plaintext';
}

function inferFramework(files: Record<string,unknown>): string {
  const paths = Object.keys(files);
  if (paths.some(p => p.includes('next.config'))) return 'next';
  if (paths.some(p => p.includes('vite.config') && files['src/App.vue'])) return 'vue';
  if (paths.some(p => p.includes('vite.config'))) return 'react-vite';
  return 'vanilla';
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectName = formData.get('name') as string || 'Imported Project';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

  try {
    // Dynamic import to avoid bundling issues
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const files: Record<string, { path: string; content: string; language: string }> = {};
    let fileCount = 0;

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (shouldSkip(relativePath)) continue;

      const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
      if (!SUPPORTED_EXTS.has(ext)) continue;
      if (fileCount > 100) break; // safety limit

      const content = await zipEntry.async('string');
      if (content.length > 100000) continue; // skip huge files

      // Strip leading folder name if zip has a root folder
      const cleanPath = relativePath.replace(/^[^/]+\//, '');

      files[cleanPath] = {
        path: cleanPath,
        content,
        language: inferLanguage(ext),
      };
      fileCount++;
    }

    if (fileCount === 0) return NextResponse.json({ error: 'No supported files found in ZIP' }, { status: 400 });

    const framework = inferFramework(files);
    const admin = await createAdminClient();

    const { data: project, error } = await admin
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectName,
        framework,
        files,
        is_public: false,
      })
      .select('id, name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ project, fileCount, framework });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
