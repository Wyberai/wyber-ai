'use client';
import type { FileNode } from '@/store/editor';
import type { BeastScanReport } from './useBeastScanRunner';

// "Apply all fixes" — shared by SecurityBeastPanel, SeoScanPanel, and
// Wyberman so the three surfaces behave identically. Two things happen in
// one click: any mechanically-generated fixes (report.fixedFiles) are
// written straight into the live project — checkpointed first, same as
// every other file-writing action in the editor, so it's one click to undo —
// and whatever's left over (checks that need real code judgment) gets
// bundled into a single AI prompt and sent to chat, instead of making the
// user click "Fix with AI" once per issue.
const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  css: 'css', html: 'html', json: 'json', xml: 'xml', txt: 'plaintext',
};

export interface ApplyBeastFixesResult {
  filesWritten: number;
  remainingCount: number;
  remainingPromptSent: boolean;
}

export function applyBeastFixes(opts: {
  report: BeastScanReport;
  files: Record<string, FileNode>;
  setFiles: (files: Record<string, FileNode>) => void;
  pushCheckpoint: (label: string) => void;
  checkpointLabel: string;
  promptForRemaining: (checkId: string) => string | undefined;
  onSwitchToChat?: () => void;
}): ApplyBeastFixesResult {
  const { report, files, setFiles, pushCheckpoint, checkpointLabel, promptForRemaining, onSwitchToChat } = opts;
  const fixedFiles = report.fixedFiles || {};
  const fixedIds = new Set(report.fixedCheckIds || []);
  let filesWritten = 0;

  if (Object.keys(fixedFiles).length > 0) {
    pushCheckpoint(checkpointLabel);
    const updated = { ...files };
    for (const [path, content] of Object.entries(fixedFiles)) {
      const existing = updated[path] as FileNode | undefined;
      const ext = path.split('.').pop() ?? '';
      updated[path] = { path, content, language: existing?.language ?? LANG_MAP[ext] ?? 'plaintext' } as FileNode;
      filesWritten++;
    }
    setFiles(updated);
  }

  const remaining = report.checks.filter(c => c.status !== 'pass' && !fixedIds.has(c.id));
  const lines = remaining.map(c => promptForRemaining(c.id)).filter((p): p is string => !!p);

  let remainingPromptSent = false;
  if (lines.length > 0) {
    const prompt = `Fix the following issues found by a scan. Match this app's existing design system, code style, and framework conventions — don't introduce a new pattern just for these fixes:\n\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: prompt })), 60);
    remainingPromptSent = true;
  }

  return { filesWritten, remainingCount: remaining.length, remainingPromptSent };
}
