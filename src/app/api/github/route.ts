import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { pushFilesToGitHub, listUserRepos, createRepo } from '@/lib/github/client';

// Both handlers used to trust a client-supplied `userId` with no session check
// at all — anyone could pass any user's id and list/push to THEIR connected
// repo. Now scoped to the authenticated caller (Bearer-bridge aware, so the
// mobile app works the same as the web editor). Also fixed to read the
// connection the real "Connect GitHub" flow actually writes
// (`github_connections.access_token` via /api/auth/github/callback) — this
// route was still reading `profiles.github_token`, a column nothing writes
// to anymore, so every push here 401'd regardless of connection state.
async function requireUser() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createAdminClient();
  const { data: conn } = await supabase.from('github_connections').select('access_token').eq('user_id', user.id).maybeSingle();
  if (!conn?.access_token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 });

  const repos = await listUserRepos(conn.access_token);
  return NextResponse.json({ repos });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, projectId, repoName, files, commitMessage } = await req.json();

  const supabase = await createAdminClient();
  const { data: conn } = await supabase.from('github_connections').select('access_token').eq('user_id', user.id).maybeSingle();
  if (!conn?.access_token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 });

  // Ownership check on every action — projectId is client-supplied.
  const { data: project } = await supabase.from('projects').select('user_id,github_repo,github_branch,name').eq('id', projectId).maybeSingle();
  if (!project || project.user_id !== user.id) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (action === 'create_repo') {
    const repo = await createRepo(conn.access_token, repoName, true);
    await supabase.from('projects').update({ github_repo: repo.full_name, github_branch: repo.default_branch }).eq('id', projectId);
    return NextResponse.json({ repo });
  }

  if (action === 'push') {
    if (!project.github_repo) return NextResponse.json({ error: 'No GitHub repo connected' }, { status: 400 });

    const [owner, repo] = project.github_repo.split('/');
    const result = await pushFilesToGitHub({
      token: conn.access_token,
      owner, repo,
      branch: project.github_branch ?? 'main',
      files,
      message: commitMessage ?? `wyber: update via AI — ${new Date().toISOString().slice(0, 16)}`,
    });

    await supabase.from('projects').update({ last_commit_sha: result.sha }).eq('id', projectId);
    return NextResponse.json({ sha: result.sha, url: result.url });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
