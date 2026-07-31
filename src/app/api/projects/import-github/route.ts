import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { shouldSkip, inferLanguage, inferFramework } from '../import/route';
import { sanitizeFiles } from '@/lib/sanitize-files';

// Optional token for private repos / higher GitHub API rate limits — same
// `github_connections` table the real "Connect GitHub" flow writes to
// (src/app/api/auth/github/callback/route.ts). This used to read
// `profiles.github_token`, a column nothing writes to anymore (see the fix
// in src/app/api/github/route.ts), so a connected account's private-repo
// imports always silently fell back to unauthenticated requests.
async function getGithubToken(admin: Awaited<ReturnType<typeof createAdminClient>>, userId: string): Promise<string | undefined> {
  const { data } = await admin.from('github_connections').select('access_token').eq('user_id', userId).maybeSingle();
  return data?.access_token ?? undefined;
}

// Same guards as the zip importer (src/app/api/projects/import/route.ts) —
// a blob path from GitHub's tree API shouldn't contain a traversal segment,
// but defense-in-depth costs nothing here, and the total-size cap bounds
// memory even against a repo with a handful of enormous tracked files.
const MAX_TOTAL_DECOMPRESSED_BYTES = 5 * 1024 * 1024;

function hasPathTraversal(path: string): boolean {
  return path.split('/').some(seg => seg === '..') || path.startsWith('/');
}

function parseGithubUrl(url: string): { owner: string; repo: string; branch: string } | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes('github.com')) return null;
    const parts = u.pathname.replace(/^\//, '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/, '');
    const branch = parts[3] || 'main'; // /tree/<branch>
    if (!owner || !repo) return null;
    return { owner, repo, branch };
  } catch { return null; }
}

async function fetchWithFallback(url: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { headers });
}

function detectMobileFiles(files: Record<string, { content: string }>): boolean {
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

  const { url, name, type } = await req.json() as { url: string; name?: string; type?: string };
  const parsed = parseGithubUrl(url);
  if (!parsed) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });

  const { owner, repo, branch } = parsed;

  const admin = await createAdminClient();
  const token = await getGithubToken(admin, user.id);

  // Try main, then master if branch not found
  const branchesToTry = branch === 'main' ? ['main', 'master'] : [branch];
  let treeData: { tree: { path: string; type: string; url: string; size: number }[] } | null = null;
  let usedBranch = branch;

  for (const b of branchesToTry) {
    const treeRes = await fetchWithFallback(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`,
      token,
    );
    if (treeRes.ok) {
      treeData = await treeRes.json();
      usedBranch = b;
      break;
    }
  }

  if (!treeData) return NextResponse.json({ error: `Could not access repo "${owner}/${repo}". Check the URL or make the repo public.` }, { status: 404 });

  const SUPPORTED_EXTS = new Set(['ts','tsx','js','jsx','css','html','json','md','vue','svg','txt','env','example']);
  const blobs = (treeData.tree || []).filter(
    f => f.type === 'blob' && !shouldSkip(f.path ?? '') && !hasPathTraversal(f.path ?? '') && SUPPORTED_EXTS.has(f.path?.split('.').pop()?.toLowerCase() ?? '')
  ).slice(0, 120);

  if (blobs.length === 0) return NextResponse.json({ error: 'No supported source files found in this repository.' }, { status: 400 });

  // Fetch file contents in parallel (batches of 10)
  const files: Record<string, { path: string; content: string; language: string }> = {};
  let totalBytes = 0;
  const BATCH = 10;
  for (let i = 0; i < blobs.length; i += BATCH) {
    if (totalBytes >= MAX_TOTAL_DECOMPRESSED_BYTES) break;
    const batch = blobs.slice(i, i + BATCH);
    await Promise.all(batch.map(async blob => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${usedBranch}/${blob.path}`;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(rawUrl, { headers });
        if (!res.ok) return;
        const content = await res.text();
        if (content.length > 150_000) return;
        if (totalBytes + content.length > MAX_TOTAL_DECOMPRESSED_BYTES) return;
        const ext = blob.path.split('.').pop()?.toLowerCase() ?? '';
        files[blob.path] = { path: blob.path, content, language: inferLanguage(ext) };
        totalBytes += content.length;
      } catch { /* skip broken blobs */ }
    }));
  }

  const fileCount = Object.keys(files).length;
  if (fileCount === 0) return NextResponse.json({ error: 'Failed to download any files from the repository.' }, { status: 500 });

  const isMobile = type === 'mobile' || (type !== 'app' && detectMobileFiles(files));
  const project_type = isMobile ? 'mobile' : 'app';
  const framework = isMobile ? 'react-native' : inferFramework(files);
  const projectName = name || `${repo} (imported)`;
  // Guarantees a buildable/previewable file set the same way an AI-generated
  // project gets (Tailwind config, entry file, ErrorBoundary, etc.) — an
  // imported repo has no such guarantee on its own.
  const sanitized = isMobile ? files : sanitizeFiles(files);

  const { data: project, error } = await admin
    .from('projects')
    .insert({ user_id: user.id, name: projectName, framework, files: sanitized, project_type, is_public: false })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project, fileCount, framework, project_type });
}
