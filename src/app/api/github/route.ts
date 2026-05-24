import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { pushFilesToGitHub, listUserRepos, createRepo } from '@/lib/github/client';

export async function GET(req: NextRequest) {
  // List user's repos
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const supabase = await createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('github_token').eq('id', userId).single();
  if (!profile?.github_token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 });

  const repos = await listUserRepos(profile.github_token);
  return NextResponse.json({ repos });
}

export async function POST(req: NextRequest) {
  const { action, userId, projectId, repoName, files, commitMessage, branch, createNew } = await req.json();

  const supabase = await createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('github_token').eq('id', userId).single();
  if (!profile?.github_token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 });

  if (action === 'create_repo') {
    const repo = await createRepo(profile.github_token, repoName, true);
    await supabase.from('projects').update({ github_repo: repo.full_name, github_branch: repo.default_branch }).eq('id', projectId);
    return NextResponse.json({ repo });
  }

  if (action === 'push') {
    const { data: project } = await supabase.from('projects').select('github_repo,github_branch,name').eq('id', projectId).single();
    if (!project?.github_repo) return NextResponse.json({ error: 'No GitHub repo connected' }, { status: 400 });

    const [owner, repo] = project.github_repo.split('/');
    const result = await pushFilesToGitHub({
      token: profile.github_token,
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
