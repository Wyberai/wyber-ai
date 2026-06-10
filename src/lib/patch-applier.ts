// Applies search/replace edit blocks to file contents with a safety net:
// exact match → whitespace-normalized match → mark failed (for full-file fallback).

export interface EditBlock {
  path: string;
  search: string;
  replace: string;
}

export interface ApplyResult {
  // Updated file contents for files that had at least one successful patch
  updated: Record<string, string>;
  // Paths whose patches couldn't be applied — caller should request a full rewrite of these
  failedPaths: string[];
  appliedCount: number;
}

// Collapse runs of whitespace and trim each line — for fuzzy matching
function normalizeLines(s: string): string[] {
  return s.split('\n').map(l => l.trim().replace(/\s+/g, ' '));
}

// Try to locate `search` inside `content` allowing whitespace differences.
// Returns [startIndex, endIndex] in the ORIGINAL content, or null.
function fuzzyLocate(content: string, search: string): [number, number] | null {
  const contentLines = content.split('\n');
  const searchLines = normalizeLines(search).filter(l => l.length > 0);
  if (searchLines.length === 0) return null;

  const normContent = contentLines.map(l => l.trim().replace(/\s+/g, ' '));

  for (let i = 0; i <= normContent.length - searchLines.length; i++) {
    let match = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (normContent[i + j] !== searchLines[j]) { match = false; break; }
    }
    if (match) {
      // Compute char offsets of lines [i .. i+searchLines.length-1] in original content
      let start = 0;
      for (let k = 0; k < i; k++) start += contentLines[k].length + 1; // +1 for \n
      let end = start;
      for (let k = i; k < i + searchLines.length; k++) end += contentLines[k].length + 1;
      return [start, Math.min(end, content.length)];
    }
  }
  return null;
}

export function applyEdits(
  files: Record<string, { content: string } | string>,
  edits: EditBlock[]
): ApplyResult {
  const updated: Record<string, string> = {};
  const failed = new Set<string>();
  let appliedCount = 0;

  // Group edits by path
  const byPath: Record<string, EditBlock[]> = {};
  for (const e of edits) {
    (byPath[e.path] = byPath[e.path] || []).push(e);
  }

  for (const [path, blocks] of Object.entries(byPath)) {
    const raw = files[path];
    let content = typeof raw === 'string' ? raw : (raw?.content ?? '');
    if (!content) {
      // No existing file to patch — can't diff, needs full rewrite
      failed.add(path);
      continue;
    }

    let workingContent = content;
    let fileHadFailure = false;

    for (const block of blocks) {
      if (!block.search) continue;
      // 1. Exact match
      const idx = workingContent.indexOf(block.search);
      if (idx !== -1) {
        workingContent = workingContent.slice(0, idx) + block.replace + workingContent.slice(idx + block.search.length);
        appliedCount++;
        continue;
      }
      // 2. Fuzzy (whitespace-normalized) match
      const loc = fuzzyLocate(workingContent, block.search);
      if (loc) {
        workingContent = workingContent.slice(0, loc[0]) + block.replace + (workingContent.slice(loc[1]).startsWith('\n') ? '' : '\n') + workingContent.slice(loc[1]);
        appliedCount++;
        continue;
      }
      // 3. Failed
      fileHadFailure = true;
    }

    if (fileHadFailure) {
      failed.add(path);
    } else {
      updated[path] = workingContent;
    }
  }

  return { updated, failedPaths: Array.from(failed), appliedCount };
}
