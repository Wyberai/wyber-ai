import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { shouldSkip, inferLanguage, inferFramework } from '../import/route';

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

  // Fetch the user's stored GitHub token if available
  const { data: profile } = await supabase.from('profiles').select('github_token').eq('id', user.id).single();
  const token = profile?.github_token ?? undefined;

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
    f => f.type === 'blob' && !shouldSkip(f.path ?? '') && SUPPORTED_EXTS.has(f.path?.split('.').pop()?.toLowerCase() ?? '')
  ).slice(0, 120);

  if (blobs.length === 0) return NextResponse.json({ error: 'No supported source files found in this repository.' }, { status: 400 });

  // Fetch file contents in parallel (batches of 10)
  const files: Record<string, { path: string; content: string; language: string }> = {};
  const BATCH = 10;
  for (let i = 0; i < blobs.length; i += BATCH) {
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
        const ext = blob.path.split('.').pop()?.toLowerCase() ?? '';
        files[blob.path] = { path: blob.path, content, language: inferLanguage(ext) };
      } catch { /* skip broken blobs */ }
    }));
  }

  const fileCount = Object.keys(files).length;
  if (fileCount === 0) return NextResponse.json({ error: 'Failed to download any files from the repository.' }, { status: 500 });

  const isMobile = type === 'mobile' || (type !== 'app' && detectMobileFiles(files));
  const project_type = isMobile ? 'mobile' : 'app';
  const framework = isMobile ? 'react-native' : inferFramework(files);
  const projectName = name || `${repo} (imported)`;

  const admin = await createAdminClient();
  const { data: project, error } = await admin
    .from('projects')
    .insert({ user_id: user.id, name: projectName, framework, files, project_type, is_public: false })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project, fileCount, framework, project_type });
}
