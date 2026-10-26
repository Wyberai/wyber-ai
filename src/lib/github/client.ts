import { Octokit } from '@octokit/rest';

export function getOctokit(token: string) {
  return new Octokit({ auth: token });
}

export interface CommitResult {
  sha: string;
  url: string;
}

// Push all files to a GitHub repo as a single commit
export async function pushFilesToGitHub(opts: {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  files: Record<string, { content: string }>;
  message: string;
}): Promise<CommitResult> {
  const octokit = getOctokit(opts.token);
  const { owner, repo, branch } = opts;

  // Get or create branch ref
  let baseSha: string;
  let baseTreeSha: string;

  try {
    const refData = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    baseSha = refData.data.object.sha;
    const commitData = await octokit.git.getCommit({ owner, repo, commit_sha: baseSha });
    baseTreeSha = commitData.data.tree.sha;
  } catch {
    // Repo is empty (no refs yet). The Git Data API used everywhere else in
    // this function can't bootstrap a truly empty repo — even createBlob
    // 409s with "Git Repository is empty." The Contents API is the one
    // GitHub endpoint documented to work here, so use it just for this one
    // bootstrap file; every push after this one has a real ref/tree and goes
    // through the normal Git Data path above.
    const initCommit = await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# WyberAi Project').toString('base64'),
      branch,
    });
    baseSha = initCommit.data.commit.sha!;
    baseTreeSha = initCommit.data.commit.tree!.sha!;
  }

  // Create blobs for all files
  const treeItems = await Promise.all(
    Object.entries(opts.files).map(async ([path, file]) => {
      const blob = await octokit.git.createBlob({
        owner, repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return { path, mode: '100644' as const, type: 'blob' as const, sha: blob.data.sha };
    })
  );

  // Create tree
  const tree = await octokit.git.createTree({ owner, repo, base_tree: baseTreeSha, tree: treeItems });

  // Create commit
  const commit = await octokit.git.createCommit({
    owner, repo,
    message: opts.message,
    tree: tree.data.sha,
    parents: [baseSha],
  });

  // Update branch ref
  await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha });

  return { sha: commit.data.sha, url: `https://github.com/${owner}/${repo}/commit/${commit.data.sha}` };
}

export async function listUserRepos(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 50 });
  return data.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, private: r.private, default_branch: r.default_branch }));
}

export async function createRepo(token: string, name: string, isPrivate = false) {
  const octokit = getOctokit(token);
  // auto_init: true — GitHub's Git Data API (createBlob/createTree/createCommit,
  // used by pushFilesToGitHub below) can't bootstrap a truly empty repo: even
  // the first createBlob call 409s with "Git Repository is empty." A repo
  // created auto_init:false stays in that state until initialized some other
  // way, so every "Connect GitHub" → push flow's first commit failed. Letting
  // GitHub create the initial README commit itself gives the Git Data API a
  // real ref/tree to build the first real push on top of.
  const { data } = await octokit.repos.createForAuthenticatedUser({ name, private: isPrivate, auto_init: true });
  return { full_name: data.full_name, default_branch: data.default_branch ?? 'main' };
}
