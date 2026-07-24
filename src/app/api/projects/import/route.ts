import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeFiles } from '@/lib/sanitize-files';

// Guards against a crafted zip: no single file may claim to be a legitimate
// source file while smuggling a path-traversal segment, and the sum of
// accepted (decompressed) file content is capped well below what a real
// small app's source would ever total — a compressed-tiny/decompressed-huge
// entry (zip bomb) blows this cap long before it exhausts memory.
const MAX_TOTAL_DECOMPRESSED_BYTES = 5 * 1024 * 1024;

function hasPathTraversal(path: string): boolean {
  return path.split('/').some(seg => seg === '..') || path.startsWith('/');
}

const SUPPORTED_EXTS = new Set([
  'ts','tsx','js','jsx','css','html','json','md','vue','svg','env','example','txt',
]);

const MOBILE_EXTRA_EXTS = new Set(['png','jpg','jpeg','gif','ttf','otf']);

const SKIP_PATHS = ['node_modules', '.git', '.next', 'dist', 'build', '.DS_Store', '__pycache__'];

export function shouldSkip(path: string) {
  return SKIP_PATHS.some(s => path.includes(s));
}

export function inferLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown', vue: 'vue', svg: 'xml',
  };
  return map[ext] ?? 'plaintext';
}

export function inferFramework(files: Record<string, unknown>): string {
  const paths = Object.keys(files);
  if (paths.some(p => p.includes('next.config'))) return 'next';
  if (paths.some(p => p.includes('vite.config')) && files['src/App.vue']) return 'vue';
  if (paths.some(p => p.includes('vite.config'))) return 'react-vite';
  return 'vanilla';
}

function detectMobile(files: Record<string, { content: string }>): boolean {
  const pkg = files['package.json'];
  if (!pkg) return false;
  try {
    const parsed = JSON.parse(pkg.content);
    const deps = { ...parsed.dependencies, ...parsed.devDependencies };
    return !!(deps['react-native'] || deps['expo']);
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectName = (formData.get('name') as string) || 'Imported Project';
  const forceType = (formData.get('type') as string) || null; // 'app' | 'mobile' | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });

  try {
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const files: Record<string, { path: string; content: string; language: string }> = {};
    let fileCount = 0;
    let totalBytes = 0;

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (shouldSkip(relativePath)) continue;

      const cleanPath = relativePath.replace(/^[^/]+\//, '');
      if (hasPathTraversal(cleanPath)) continue;

      const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
      const isMobileAsset = MOBILE_EXTRA_EXTS.has(ext);
      if (!SUPPORTED_EXTS.has(ext) && !isMobileAsset) continue;
      if (fileCount >= 150) break;
      if (totalBytes >= MAX_TOTAL_DECOMPRESSED_BYTES) break;

      const content = isMobileAsset
        ? `[binary asset: ${relativePath}]`
        : await zipEntry.async('string');

      if (!isMobileAsset && content.length > 150_000) continue;
      if (!isMobileAsset && totalBytes + content.length > MAX_TOTAL_DECOMPRESSED_BYTES) continue;

      files[cleanPath] = { path: cleanPath, content, language: inferLanguage(ext) };
      fileCount++;
      totalBytes += content.length;
    }

    if (fileCount === 0) return NextResponse.json({ error: 'No supported files found in ZIP' }, { status: 400 });

    const isMobile = forceType === 'mobile' || (forceType !== 'app' && detectMobile(files));
    const project_type = isMobile ? 'mobile' : 'app';
    const framework = isMobile ? 'react-native' : inferFramework(files);
    // Guarantees a buildable/previewable file set (Tailwind config, entry
    // file, ErrorBoundary, etc.) the same way an AI-generated project gets —
    // an imported zip has no such guarantee on its own.
    const sanitized = isMobile ? files : sanitizeFiles(files);
    const admin = await createAdminClient();

    const { data: project, error } = await admin
      .from('projects')
      .insert({ user_id: user.id, name: projectName, framework, files: sanitized, project_type, is_public: false })
      .select('id, name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ project, fileCount, framework, project_type });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
