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
    // Repo might be empty — create initial commit
    const initBlob = await octokit.git.createBlob({ owner, repo, content: '# Wyber AI Project', encoding: 'utf-8' });
    const initTree = await octokit.git.createTree({ owner, repo, tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: initBlob.data.sha }] });
    const initCommit = await octokit.git.createCommit({ owner, repo, message: 'Initial commit', tree: initTree.data.sha, parents: [] });
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: initCommit.data.sha });
    baseSha = initCommit.data.sha;
    baseTreeSha = initTree.data.sha;
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
  const { data } = await octokit.repos.createForAuthenticatedUser({ name, private: isPrivate, auto_init: false });
  return { full_name: data.full_name, default_branch: data.default_branch ?? 'main' };
}
