'use client'
import { creditCost, tierAllowedForPlan, MODEL_META, type ActionType } from '@/lib/credits';
import { track } from '@/lib/track';
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback, memo, useMemo, type ReactNode } from 'react';
import { parseGenerationOutput, parseEditBlocks, cleanStreamingDisplay, extractProgressLines, extractReasoning } from '@/lib/file-parser';
import { applyEdits } from '@/lib/patch-applier';
import { STARTER_TEMPLATES, isPlaceholderApp } from '@/lib/starter-templates';
import { detectDeps, detectDepsInCode, detectRegulated, RegulatedDomain } from '@/lib/detect-deps';
import { classifyIntent } from '@/lib/intent';
import { windowedHistory } from '@/lib/chat-history-window';
import { assessDesignFreshness } from '@/lib/design-quality-check';
import { extractAgentEvents, deriveAgentLanes, type AgentEvent } from '@/lib/agents/events';
import { AGENT_TEAM_ENABLED } from '@/lib/agents/roster';
import { LoopGuard } from '@/lib/agents/loop-guard';
import { runQaChecks } from '@/lib/agents/qa-checks';
import { parsePlanManifest, buildStagedPlan, forgeLine } from '@/lib/staged-plan';
import { useAgentTurnStore } from '@/store/agent-turn';
import type { ChatMessage } from '@/store/editor';
import { AgentTeamFeed, AgentFeedBoundary } from './agent-team/AgentTeamFeed';
import { TurnReceipt } from './agent-team/TurnReceipt';
import { SecurityReportCard } from './agent-team/SecurityReportCard';
import { LoopStopCard } from './agent-team/LoopStopCard';
import { FixOfferCard } from './agent-team/FixOfferCard';
import { UpgradeModal } from './UpgradeModal';
import { PlanMode } from './PlanMode';
import { DirectionCards } from './DirectionCards';
import { VoiceButton } from './VoiceButton';
import { FileMentionDropdown } from './FileMentionDropdown';
import { useT } from '@/lib/i18n/useT';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { LOCALE_SPEECH_CODE } from '@/lib/i18n/locales';
import { EDITOR_CHATPANEL_STRINGS } from '@/lib/i18n/dict/editor-chatpanel';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import tsxLang from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescriptLang from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsxLang from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import javascriptLang from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import cssLang from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markupLang from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import bashLang from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sqlLang from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import pythonLang from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import yamlLang from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdownLang from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

// Register only the languages this app actually generates/discusses — keeps the
// async-light bundle small instead of shipping every Prism grammar.
SyntaxHighlighter.registerLanguage('tsx', tsxLang);
SyntaxHighlighter.registerLanguage('typescript', typescriptLang);
SyntaxHighlighter.registerLanguage('ts', typescriptLang);
SyntaxHighlighter.registerLanguage('jsx', jsxLang);
SyntaxHighlighter.registerLanguage('javascript', javascriptLang);
SyntaxHighlighter.registerLanguage('js', javascriptLang);
SyntaxHighlighter.registerLanguage('json', jsonLang);
SyntaxHighlighter.registerLanguage('css', cssLang);
SyntaxHighlighter.registerLanguage('html', markupLang);
SyntaxHighlighter.registerLanguage('xml', markupLang);
SyntaxHighlighter.registerLanguage('bash', bashLang);
SyntaxHighlighter.registerLanguage('sh', bashLang);
SyntaxHighlighter.registerLanguage('shell', bashLang);
SyntaxHighlighter.registerLanguage('sql', sqlLang);
SyntaxHighlighter.registerLanguage('python', pythonLang);
SyntaxHighlighter.registerLanguage('py', pythonLang);
SyntaxHighlighter.registerLanguage('yaml', yamlLang);
SyntaxHighlighter.registerLanguage('yml', yamlLang);
SyntaxHighlighter.registerLanguage('markdown', markdownLang);
SyntaxHighlighter.registerLanguage('md', markdownLang);

function uid() { return Math.random().toString(36).slice(2, 9); }

// Fold a turn's agent events into the per-message receipt shape
// (ChatMessage.agentReport) — one summary line per agent + the findings list.
function buildAgentReport(events: AgentEvent[], passesUsed: number, credits: number | undefined, t: (key: string) => string): NonNullable<ChatMessage['agentReport']> {
  const lanes = deriveAgentLanes(events);
  const agents = lanes.map(l => {
    let summary = l.lastStatus || (l.state === 'done' ? t('doneStatusMsg') : t('workedThisTurnMsg'));
    if (l.agent === 'security') {
      const fixed = l.findings.filter(f => f.resolution === 'fixed').length;
      const flagged = l.findings.filter(f => f.resolution === 'flagged').length;
      summary = l.findings.length === 0
        ? t('securityNoIssuesMsg')
        : t('securityFixedMsg').replace('{count}', String(fixed)).replace('{plural}', fixed === 1 ? '' : 's')
          + (flagged ? t('securityFlaggedSuffixMsg').replace('{count}', String(flagged)) : '');
    }
    return { id: l.agent, summary };
  });
  const findings = lanes.flatMap(l => l.findings).map(f => ({
    findingId: f.findingId,
    severity: f.severity,
    title: f.detail,
    status: (f.resolution === 'fixed' ? 'fixed' : 'flagged') as 'fixed' | 'flagged',
  }));
  return { agents, findings, passesUsed, credits };
}

// Resolve a local import specifier (relative, `@/`, or `src/`) to an existing
// file path. Bare module specifiers (node_modules) return null.
function resolveSpecifier(spec: string, fromPath: string, pathSet: Set<string>): string | null {
  let base: string;
  if (spec.startsWith('.')) {
    const dir = fromPath.split('/').slice(0, -1);
    for (const p of spec.split('/')) {
      if (p === '.' || p === '') continue;
      else if (p === '..') dir.pop();
      else dir.push(p);
    }
    base = dir.join('/');
  } else if (spec.startsWith('@/')) {
    base = 'src/' + spec.slice(2);
  } else if (spec.startsWith('src/')) {
    base = spec;
  } else {
    return null;
  }
  for (const e of ['', '.tsx', '.ts', '.jsx', '.js', '.vue', '.css']) {
    if (pathSet.has(base + e)) return base + e;
  }
  for (const e of ['/index.tsx', '/index.ts', '/index.jsx', '/index.js']) {
    if (pathSet.has(base + e)) return base + e;
  }
  return null;
}

// Shallow-transitively collect files imported by the seed files. This lets the
// model SEE helper files (lib/api, Auth, hooks) that the relevant files import,
// instead of being blind to them and recreating them every edit (the loop bug).
function collectImportedPaths(seeds: string[], allPaths: string[], getContent: (p: string) => string, maxExtra = 8): string[] {
  const pathSet = new Set(allPaths);
  const found = new Set<string>();
  const seen = new Set(seeds);
  const queue = [...seeds];
  const importRe = /(?:from\s+|import\s+)['"]([^'"]+)['"]/g;
  while (queue.length && found.size < maxExtra) {
    const cur = queue.shift()!;
    const content = getContent(cur);
    if (!content) continue;
    let m: RegExpExecArray | null;
    importRe.lastIndex = 0;
    while ((m = importRe.exec(content)) !== null) {
      const resolved = resolveSpecifier(m[1], cur, pathSet);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        found.add(resolved);
        queue.push(resolved);
        if (found.size >= maxExtra) break;
      }
    }
  }
  return [...found];
}

// Extract a file's "surface" — exported/declared signatures only — so the model
// is aware of files it isn't shown in full and edits them via their exports
// instead of recreating them. This is the cheap fix for large apps breaking on
// edit: every file's API is visible without paying to ship every file's body.
function extractSignatures(code: string): string {
  const out: string[] = [];
  for (const raw of code.split('\n')) {
    const t = raw.trim();
    if (
      /^export\s+(default\s+)?(async\s+)?(function|const|let|class|interface|type|enum)\b/.test(t) ||
      /^export\s+\{/.test(t) ||
      /^(export\s+)?function\s+\w+/.test(t)
    ) {
      out.push(t.replace(/\s*=>?\s*\{?\s*$/, '').slice(0, 160));
      if (out.length >= 20) break;
    }
  }
  return out.join('\n') || '(no exports detected)';
}

// Strips internal markers (<thinking>/<file>/<edit>/[progress:...]) that can
// leak into a message's natural-language text regardless of which lane
// produced it. Safe to apply to ANY assistant message before rendering —
// unlike cleanMessage below, it never touches code blocks, bullets, or
// sentence count, so it can't mangle a real conversational answer.
function stripInternalMarkers(text: string): string {
  let t = text;
  t = t.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  t = t.replace(/<file[^\s>]*[^>]*>[\s\S]*?<\/file>/gi, '');
  t = t.replace(/<edit\s+path="[^"]*">[\s\S]*?<\/edit>/gi, '');
  // cut any unclosed trailing block (stream/save ended mid-block)
  const _cuts = [t.search(/<thinking>/i), t.search(/<file/i), t.search(/<edit\s+path="/i)].filter(i => i !== -1);
  if (_cuts.length) t = t.slice(0, Math.min(..._cuts));
  t = t.replace(/\[progress:[^\]]+\]/gi, '');
  // Platform protocol that must never render as chat: the auto-applied schema
  // block and stray SEARCH/REPLACE conflict markers outside an <edit> wrapper.
  t = t.replace(/\/\*\s*SQL TO RUN IN SUPABASE[\s\S]*?\*\//gi, '');
  const _openSql = t.search(/\/\*\s*SQL TO RUN IN SUPABASE/i);
  if (_openSql !== -1) t = t.slice(0, _openSql);
  t = t.replace(/<<<<<<<\s*SEARCH[\s\S]*?>>>>>>>\s*REPLACE/g, '');
  const _openSearch = t.search(/<<<<<<<\s*SEARCH/);
  if (_openSearch !== -1) t = t.slice(0, _openSearch);
  return t.trim();
}

// Aggressively distills the BUILD lane's raw commentary (which streams
// alongside <file>/<edit> blocks and can leak code/JSX/file-manifest lines)
// down to a short "Built: X" style confirmation. Only ever call this on
// build-turn text before storing it — never on conversational chat-lane
// answers, which need their full sentences, bullets, and code blocks intact.
function cleanMessage(text: string, doneFallback: string): string {
  let t = stripInternalMarkers(text);
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`src\/[^`]+`/g, '');
  const lines = t.split('\n').map(l => l.trim()).filter(l => {
    if (!l) return false;
    if (l.startsWith('<file')) return false;
    if (l.startsWith('import ')) return false;
    if (l.startsWith('export ')) return false;
    if (l.startsWith('export default')) return false;
    if (l.startsWith('const ') && l.includes(': ') && l.includes('{')) return false;
    if (l.startsWith('interface ')) return false;
    if (l.startsWith('type ') && l.includes('=')) return false;
    if (l.startsWith('function ') && l.includes('{')) return false;
    if (l.startsWith('return (') || l === 'return (') return false;
    if (l.startsWith('//')) return false;
    if (l === '{' || l === '}' || l === '};' || l === '});') return false;
    if (l.startsWith('{ id:') || l.startsWith('id:') || l.startsWith('name:')) return false;
    if (l.match(/^[a-z]+: ['"\[{]/)) return false;
    // file-manifest list items: "- path/to/File.tsx" or "- File.tsx: description"
    if (l.startsWith('- ') && /\.\w{2,4}/.test(l)) return false;
    // Pre-build PLAN block ("Building: X / Sections: ... / Files: ...") — it's
    // process narration the prompt asks for BEFORE files; persisting it next to
    // the "Built:" recap made every receipt read twice as long and confused
    // users ("Building" and "Built" for the same app in one message). The live
    // ticker already showed it; only the recap is the receipt.
    if (/^building:\s/i.test(l)) return false;
    if (/^sections?:\s/i.test(l)) return false;
    if (/^files?:\s/i.test(l)) return false;
    // continuation/self-heal reasoning openers
    if (/^(i notice|i see that|i'll continue|let me continue|continuing|previous output|your previous|it seems|it looks like)/i.test(l)) return false;
    // file-list headers
    if (/^(here(?:'s| are)|the following files|these files|i(?:'m| will| am) (?:now |going to )?(?:build|creat|generat|output|provid))/i.test(l)) return false;
    // Working narration between blocks ("Now fix Dashboard.tsx — wrap the
    // chart:", "Let me tighten the button row:"). The code blocks it framed
    // are stripped above, so these read as rambling that trails off
    // mid-thought — a real user called the result "shit responses". A line
    // ending in ":" is narration INTO a now-removed block; the openers below
    // are step-by-step commentary, never a finished-result recap. If
    // everything is narration, the caller falls back to "Done" + file chips.
    if (/:$/.test(l) && !l.startsWith('- ') && !/^#{1,4} /.test(l)) return false;
    if (/^(now |let me |i'll (?:go|now|start|then|also)|looking at|checking |verifying |first,? |next,? )/i.test(l)) return false;
    return true;
  });
  let result = lines.join('\n').trim();
  // No more 2-sentence guillotine. A build summary that lists what changed
  // (Lovable-style) is the receipt for the credits just charged — and history
  // threading depends on it: truncating an audit's findings list to two
  // sentences deleted the very list the user's NEXT message ("fix all 6")
  // referred to, leaving the model with nothing to fix. The line filters
  // above already strip code/manifest noise; keep structure (bullets,
  // paragraphs) and just cap runaway length.
  result = result.replace(/[ \t]{2,}/g, ' ').trim();
  if (result.length > 2500) result = result.slice(0, 2500).trimEnd() + '…';
  if (!result || result.length < 3) result = doneFallback;
  return result;
}

// A build receipt renders its first line as the visible lead; everything after
// collapses behind "Show details". Split-only helper — never mutates content.
function splitReceipt(content: string): { lead: string; rest: string } {
  const t = content.trim();
  const nl = t.indexOf('\n');
  if (nl === -1) return { lead: t, rest: '' };
  return { lead: t.slice(0, nl).trim(), rest: t.slice(nl + 1).trim() };
}

// A real fenced code block (```sql ... ``` etc.) with a copy button AND real
// language-aware syntax highlighting — the runnable-SQL / CLI-command case the
// chat lane is now explicitly allowed to output (see /api/assist's system
// prompt) needs to actually be copyable, not squeezed through the inline-`code`
// styling meant for single words, and monospace-only rendering reads as a toy
// next to a real coding assistant.
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin:'6px 0', borderRadius:8, border:'1px solid var(--ide-border)', background:'var(--bg-overlay)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 8px', borderBottom:'1px solid var(--ide-border)', background:'var(--bg-base)' }}>
        <span style={{ fontSize:10, color:'var(--ide-text3)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.04em' }}>{lang || 'code'}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
          style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color: copied ? 'var(--ide-green)' : 'var(--ide-text3)', cursor:'pointer', fontWeight:600 }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang || 'text'}
        style={oneDark}
        customStyle={{ margin:0, padding:'8px 10px', overflowX:'auto', background:'transparent', fontSize:12, lineHeight:1.5 }}
        codeTagProps={{ style: { fontFamily:'monospace' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Markdown component overrides. Typography (p/h1-h4/ul/ol/li/blockquote/hr/
// table cells/inline code) is now handled by shadcn/typeset CSS — the
// renderMessage() wrapper below applies .typeset.typeset-chat — so those
// elements render bare and pick up typeset's :where() rules instead of
// fighting them with inline styles. Only two overrides remain, both for
// BEHAVIOR typeset doesn't provide:
//  - `a`: forces target="_blank"/rel — link-opening behavior, not styling.
//  - `table`: typeset needs an explicit .typeset-scroll wrapper to make wide
//    tables scroll instead of visually compressing inside the chat column.
//  - `pre`: fenced code blocks land here (inline code never has a `pre`
//    wrapper), rendered as the custom CodeBlock (copy button + real Prism
//    syntax highlighting) that typeset has no equivalent for.
const markdownComponents: Components = {
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <div className="typeset-scroll"><table>{children}</table></div>,
  pre: ({ children }) => {
    // children is the single <code> element react-markdown produced for this
    // fenced block; pull its language + text out and render our own CodeBlock
    // instead of the default <pre><code> wrapper.
    const codeEl = Array.isArray(children) ? children[0] : children;
    const props = (codeEl as { props?: { className?: string; children?: ReactNode } })?.props;
    const match = /language-(\w+)/.exec(props?.className || '');
    // children can be an array of text nodes — String() would comma-join them
    // and corrupt copied code, so join('') explicitly.
    const raw = props?.children;
    const codeText = (Array.isArray(raw) ? raw.join('') : String(raw ?? '')).replace(/\n$/, '');
    return <CodeBlock lang={match?.[1] || ''} code={codeText} />;
  },
};

function renderMessage(text: string) {
  // <thinking>/<file>/<edit>/[progress:...] are this app's own custom protocol,
  // not markdown — strip them first, same as before. Also drop any stray
  // ```edited:...``` marker (parseGenerationOutput already strips these from
  // freshly-generated text, but renderMessage also runs on older persisted
  // messages, so keep this defensive strip too).
  const cleaned = stripInternalMarkers(text).replace(/```edited:[^`]*```/g, '');
  return (
    <div className="typeset typeset-chat">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

// Memoized message body: markdown parsing + Prism highlighting are the most
// expensive render work in the panel, and messages are immutable once done —
// without this, EVERY keystroke in the input box re-parsed and re-highlighted
// every message in the thread (typing became visibly laggy once the chat held
// a few large SQL blocks).
const MessageBody = memo(function MessageBody({ content }: { content: string }) {
  return <>{renderMessage(content)}</>;
});

// What the message-level Copy button should put on the clipboard. When a
// message is mostly one big fenced block (the "run this SQL" case), users
// paste the copy STRAIGHT into the Supabase SQL editor — copying the raw
// markdown (```sql fences, surrounding prose) hands them a guaranteed syntax
// error. Mostly-code messages copy just the runnable code; prose messages
// still copy in full, minus the fence markers.
function copyableMessageText(content: string): string {
  const blocks = [...content.matchAll(/```[\w-]*\n?([\s\S]*?)```/g)].map(m => m[1]);
  const codeLen = blocks.reduce((n, b) => n + b.length, 0);
  if (blocks.length > 0 && codeLen / content.length > 0.5) return blocks.join('\n\n').trim();
  return content.replace(/^```[\w-]*\s*$/gm, '').trim();
}

interface AttachedImage { dataUrl: string; base64: string; mimeType: string; name: string; }
type AttachedKind = 'image' | 'text' | 'pdf' | 'file';
interface AttachedFile { localId: string; name: string; mimeType: string; kind: AttachedKind; size: number; url?: string; text?: string; base64?: string; uploading: boolean; }
const TEXT_FILE_RE = /\.(txt|md|markdown|csv|tsv|json|ya?ml|html?|xml|css|scss|js|jsx|ts|tsx|py|rb|go|rs|java|php|sql|sh|env|toml|ini|log)$/i;
const isTextFile = (f: File) => f.type.startsWith('text/') || f.type === 'application/json' || TEXT_FILE_RE.test(f.name);
const isPdfFile = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const isSpreadsheetFile = (f: File) => /\.xlsx?$/i.test(f.name);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
interface Props { projectId?: string; userId?: string; projectType?: string }

type ModelTier = 'fast' | 'default' | 'premium' | 'fable' | 'gpt';
// The visible picker: Sonnet (fast, default selection), Opus (default tier),
// and Fable. 'premium' is intentionally not offered here — it's the same
// Opus model as 'default' with only a priority-queue difference, not a
// distinct choice a user would pick by name. 'gpt' is temporarily pulled
// from the picker (not deleted — MODEL_IDS.gpt/openai-coding.ts stay intact)
// pending a working OpenAI key; re-add it here once that's confirmed live.
const PICKABLE_TIERS: ModelTier[] = ['fast', 'default', 'fable'];

export function ChatPanel({ projectId, userId, projectType: projectTypeProp }: Props) {
  const {
    messages, isGenerating, addMessage, updateMessage, setMessages,
    setIsGenerating, bumpGenerationTurn, streamingContent, setStreamingContent, clearStreamingContent,
    setFiles, files, framework, consumeCredit, credits, hasGeneratedFiles, setHasGeneratedFiles,
    project, setProject, hydrated, knowledge, pushCheckpoint, restoreCheckpoint, checkpoints, initialPrompt,
  } = useEditorStore();

  const projectType = projectTypeProp ?? project?.project_type;
  const resolvedProjectId = projectId || project?.id;
  const resolvedUserId = userId || project?.userId;
  const t = useT(EDITOR_CHATPANEL_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const { locale } = useLocale();

  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  // Locally-dismissed design-quality suggestion chips — component-local only,
  // no store/DB change (the suggestion itself is already non-persisted).
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'nudge' | 'out-of-credits'>('nudge');
  const [buildNudgeDismissed, setBuildNudgeDismissed] = useState(false);
  const lastBuildMsgId = useMemo(
    () => [...messages].reverse().find(m => m.status === 'done' && !!m.agentReport)?.id,
    [messages],
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const isFirstBuild = !hasGeneratedFiles;
  const BUILD_MSGS = isFirstBuild
    ? [t('planningAppMsg'), t('settingUpDesignMsg'), t('writingComponentsMsg'), t('wiringInteractionsMsg'), t('addingDataMsg'), t('polishingUiMsg'), t('almostThereMsg')]
    : [t('applyingChangesMsg'), t('updatingComponentsMsg'), t('refiningCodeMsg'), t('almostDoneMsg')];

  useEffect(() => {
    if (!isGenerating) { setElapsed(0); return; }
    setProgressSteps([]);
    const startTime = Date.now();
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [isGenerating]);
  // Phase label derived from elapsed time: one phase per ~10s, CLAMPED at the
  // last entry. The old version advanced every second and wrapped with %, so
  // the label cycled the whole list every few seconds — users watched builds
  // go "Almost there..." → back to "Planning your app...", which read as the
  // build restarting. Real [progress:] markers replace this fallback entirely
  // once they start arriving.
  const buildMsg = BUILD_MSGS[Math.min(Math.floor(elapsed / 10), BUILD_MSGS.length - 1)];

  const [hasInit, setHasInit] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [imageReading, setImageReading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const attachedFilesRef = useRef<AttachedFile[]>([]);
  const uploadPromisesRef = useRef<Record<string, Promise<unknown>>>({});
  useEffect(() => { attachedFilesRef.current = attachedFiles; }, [attachedFiles]);
  const [dragOver, setDragOver] = useState(false);
  // The dropdown shows and defaults to Sonnet, but that default is NOT sent
  // to the server as an explicit override — only a tier the user actually
  // picked is (see tierTouched below, and the request-body construction
  // that gates on it). This keeps the server's own resolveModelTier()
  // complexity classifier (a sub-cent Haiku call that escalates genuinely
  // large/complex builds to Opus) doing its job for anyone who never
  // touches the picker, instead of silently hard-locking every untouched
  // build to Sonnet regardless of how complex it turns out to be.
  const [modelTier, setModelTier] = useState<ModelTier>('fast');
  const [tierTouched, setTierTouched] = useState(false);
  // Plan gating for the model picker — fetched once (same endpoint TopBar's
  // balance refresh already hits after every turn) so locked tiers can be
  // disabled in the dropdown instead of round-tripping to the server only
  // to bounce with an upgrade-required error.
  const [userPlan, setUserPlan] = useState<string>('free');
  // India vs US pricing differ by more than currency symbol — they're separate
  // plan tiers ($29 Starter vs ₹499 Spark) — so the out-of-credits upgrade CTA
  // below needs the visitor's actual region, not just a $ symbol swap.
  const [creditsCurrency, setCreditsCurrency] = useState<'USD' | 'INR'>('USD');
  useEffect(() => {
    fetch('/api/credits/deduct', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        if (data.plan) setUserPlan(data.plan);
        if (data.currency === 'INR' || data.currency === 'USD') setCreditsCurrency(data.currency);
      })
      .catch(() => {});
  }, []);
  const [planMode, setPlanMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ prompt: string; image: AttachedImage | null } | null>(null);
  // First-build advisory offer: on a brand-new project's first message, ask
  // once whether the user wants to see a build plan/roadmap first (reuses the
  // existing, already-built Plan Mode flow) instead of silently building.
  // Users don't discover the manual "◎ Plan" toggle on their own — this makes
  // the same feature reachable without requiring that discovery. Shown at
  // most once per project (planOfferShownRef), regardless of outcome.
  const [pendingPlanOffer, setPendingPlanOffer] = useState<{ prompt: string; img: AttachedImage | null; hasAttachments: boolean } | null>(null);
  const planOfferShownRef = useRef(false);
  // Design direction picked on the offer card's palette cards (null = server
  // prompt-matches one). PlanMode shows its own cards, so this only feeds the
  // "Just build it" path.
  const [offerPaletteId, setOfferPaletteId] = useState<string | null>(null);
  const [lastCreditCost, setLastCreditCost] = useState<number | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  // Intent router: when a message is conversational (a question/confirmation),
  // we show a lightweight "Thinking…" indicator instead of the build loader and
  // route to /api/assist — no credits, no file parsing.
  const [chatThinking, setChatThinking] = useState(false);

  // ── Pre-gen dep gate state ──────────────────────────────────────────────
  // When deps are detected, we pause before generation and show a connect UI.
  // pendingGenArgs holds (prompt, img) waiting for the user to decide.
  const [pendingGenArgs, setPendingGenArgs] = useState<{ prompt: string; img: AttachedImage | null; needsSupabase: boolean; needsStripe: boolean; composioTools: string[]; customGroup?: { label: string; icon: string; color: string; keys: { name: string; placeholder: string }[] } | null } | null>(null);
  // Inline secret collection for the gate UI (key name → value)
  const [inlineSecrets, setInlineSecrets] = useState<Record<string, string>>({});
  const [secretSaving, setSecretSaving] = useState(false);
  // Live progress steps shown during streaming
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  // Live extended-thinking text (opt-in, new-build full generation only) while
  // streaming, plus which finished messages have their stored reasoning expanded.
  const [liveReasoning, setLiveReasoning] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  // Build receipts render collapsed (first line + "Show details") — Lovable's
  // progressive disclosure. FULL text stays in message content/history so the
  // model never loses referents (the Jul 8 lesson); only the RENDER collapses.
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());

  const connectors = useEditorStore(s => s.connectors);
  const supabaseConnected = connectors.some(c => c.service === 'supabase');
  const wyberCloudConnected = connectors.some(c => c.service === 'cloud-database');
  const [pendingRegulated, setPendingRegulated] = useState<{ prompt: string; img: AttachedImage | null; domains: RegulatedDomain[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref so event handlers always get the latest executeGeneration without stale closure
  const executeGenerationRef = useRef<((msg: string, img: AttachedImage | null, opts?: { silent?: boolean; continuation?: boolean; echoedUser?: boolean; displayContent?: string; paletteId?: string | null; stage?: 'scaffold' | 'fill' | 'agentFix'; stageFiles?: string[]; stagePurposes?: string[]; internalPass?: boolean; finalPass?: boolean; preserveAgentTurn?: boolean }) => Promise<boolean>) | null>(null);
  // Cap consecutive self-heal (autofix) runs so a broken build can't loop and drain credits.
  const autofixCountRef = useRef(0);
  const MAX_AUTOFIX = 2;
  // Futility detection on top of the volume cap: the SAME error signature
  // twice means the fix strategy is failing — stop and show LoopStopCard
  // instead of burning the remaining budget (see lib/agents/loop-guard.ts).
  const loopGuardRef = useRef(new LoopGuard());
  // ── Agent team (flag-gated, see src/lib/agents) ─────────────────────────
  // Accumulated agent events for the CURRENT turn across all its passes (plan
  // → scaffold → fills + client-synthesized events). The streaming pass's live
  // events render on top; the agent-turn store is what the feed reads.
  const turnAgentEventsRef = useRef<AgentEvent[]>([]);
  // Internal passes used this turn (fills, fixes) — the anti-runaway budget.
  const agentPassCountRef = useRef(0);
  const MAX_INTERNAL_PASSES = 8;
  // Credits actually charged this turn across passes (fills report 0).
  const turnCreditsRef = useRef(0);
  const agentEvents = useAgentTurnStore(s => s.events);
  const pushAgentEvents = useCallback((...evs: AgentEvent[]) => {
    if (!AGENT_TEAM_ENABLED) return;
    turnAgentEventsRef.current = [...turnAgentEventsRef.current, ...evs];
    useAgentTurnStore.getState().setEvents(turnAgentEventsRef.current);
  }, []);
  // Lifted out of executeGeneration's local scope so a user-facing "Stop" button
  // can abort an in-flight generation from outside that closure.
  const abortControllerRef = useRef<AbortController | null>(null);
  // Auto-reload timer set after a network-drop mid-build (server keeps running
  // and saves files, so we reload once they should be persisted). Cleared if
  // the user starts a new build before the timer fires.
  const dropReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distinguishes a user-pressed Stop from the 320s auto-timeout hitting the
  // same AbortController, so the resulting message can be honest about which.
  const userStoppedRef = useRef(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, streamingContent]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // Persist a message to Supabase
  const persistMessage = useCallback((role: 'user'|'assistant', content: string, filesChanged?: string[], clientId?: string) => {
    if (!resolvedProjectId) return;
    fetch('/api/projects/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: resolvedProjectId, role, content, filesChanged: filesChanged || [], clientId }),
    }).catch(() => {});
  }, [resolvedProjectId]);

  // Init ONLY for brand-new projects — wait for hydration, only seed if truly empty
  useEffect(() => {
    if (!hydrated || hasInit) return;
    setHasInit(true);
    const hasFiles = Object.keys(files ?? {}).length > 0;
    const hasMessages = messages.length > 0;
    // Existing project with work — do NOT reset. Just leave loaded state.
    if (hasFiles || hasMessages) return;
    // Brand new project — seed starter template + greeting (skip if no template for this framework)
    const template = STARTER_TEMPLATES[framework];
    if (template) setFiles(template);
    const greeting = { id: uid(), role:'assistant' as const, content:`**WyberAi ready** — describe what you want to build, or paste a screenshot to match.`, timestamp:Date.now(), status:'done' as const };
    addMessage(greeting);
  }, [hydrated, hasInit, files, messages, framework, setFiles, addMessage]);

  // Auto-trigger generation if a prompt was passed from dashboard/homepage
  useEffect(() => {
    if (!resolvedProjectId || !hasInit) return;
    const key = `wyber_prompt_${resolvedProjectId}`;
    // Never regenerate over an already-built project. The one-shot sessionStorage
    // key is the primary guard, but if it ever lingers (e.g. a force-reload mid
    // generation), this makes reopening a saved app load it deterministically
    // instead of re-running generation — which is non-deterministic and yields a
    // different app on every open. hasGeneratedFiles is true only once a real app
    // is loaded/built (the brand-new starter scaffold leaves it false).
    if (hasGeneratedFiles) { sessionStorage.removeItem(key); return; }
    // Primary: the one-shot sessionStorage handoff from the dashboard.
    let promptToRun = sessionStorage.getItem(key) || '';
    // Fallback: sessionStorage can be lost to a race or reload, but the project's
    // initial_prompt is durably in the DB. Use it ONLY for a truly fresh, never-
    // touched project (no messages, no files) so we can never re-generate over an
    // existing app or double-charge credits.
    if (!promptToRun && initialPrompt) {
      const st = useEditorStore.getState();
      if (st.messages.length === 0 && Object.keys(st.files).length === 0) {
        promptToRun = initialPrompt;
      }
    }
    if (!promptToRun) return;
    sessionStorage.removeItem(key);
    // Name the project from its prompt RIGHT NOW, independent of the build.
    // The old rename lived in the generate route's after() hook behind
    // first-build detection, which proved unreliable (any files saved to the
    // DB flip it forever) — so projects kept the raw prompt slice as a name.
    // The route no-ops if the user already renamed the project manually.
    fetch('/api/projects/auto-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: resolvedProjectId, prompt: promptToRun }),
    }).then(r => r.json()).then(d => {
      if (!d?.name) return;
      const p = useEditorStore.getState().project;
      if (p && p.name !== d.name) setProject({ ...p, name: d.name });
    }).catch(() => { /* best-effort — worst case the name stays as-is */ });
    const timer = setTimeout(() => {
      setInput(promptToRun);
      window.dispatchEvent(new CustomEvent('wyber_auto_generate', { detail: { prompt: promptToRun } }));
    }, 800);
    return () => clearTimeout(timer);
  }, [resolvedProjectId, hasInit, hasGeneratedFiles, initialPrompt, setProject]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { prompt } = e.detail;
      if (!prompt) return;
      setInput(prompt);
      setTimeout(() => {
        const btn = document.querySelector('[data-send-button]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 100);
    };
    window.addEventListener('wyber_auto_generate', handler as EventListener);
    // Self-heal / auto-fix: run silently — no user-visible message, no send button
    const autofixHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.prompt) return
      // Autonomy dial (ask-first): optional fix passes — runtime-error
      // self-heals from the preview AND QA's structural-issue fixes — are
      // OFFERED, not run (this matches the dial's documented contract in
      // store/agent-turn.ts). Build-completion passes that aren't really a
      // new autonomous decision (continuation: cut streams, failed patches —
      // just finishing what this turn already promised) and user-approved
      // offers always run. QA fixes are marked `qaFix` specifically so they
      // stay gated despite also being dispatched with `continuation: true`
      // (that flag is reused there only to skip the futility-guard recording
      // below, not to mean "always run"). This gate comes BEFORE the futility
      // guard so offering doesn't record the error — only an actually-
      // attempted fix counts toward the repeat limit.
      if (AGENT_TEAM_ENABLED && (!detail.continuation || detail.qaFix) && !detail.approved
          && useAgentTurnStore.getState().autonomy === 'ask') {
        useEditorStore.getState().addMessage({
          id: uid(), role: 'assistant', content: '', timestamp: Date.now(), status: 'done',
          fixOffer: {
            prompt: detail.prompt,
            error: detail.error ? String(detail.error).slice(0, 300) : undefined,
            label: detail.qaFix
              ? t('qaFixOfferLabel')
              : t('autoFixOfferLabel'),
          },
        })
        return
      }
      // Futility guard: the SAME runtime error twice means the fix strategy
      // isn't working — stop, show what keeps failing, and hand the user the
      // wheel instead of spending the remaining self-heal budget on it.
      if (detail.error) {
        const seen = loopGuardRef.current.record(detail.error)
        if (seen >= 2) {
          if (AGENT_TEAM_ENABLED) {
            turnAgentEventsRef.current = [...turnAgentEventsRef.current, { agent: 'qa', status: 'stuck', detail: t('sameErrorStoppingMsg') }]
            useAgentTurnStore.getState().setEvents(turnAgentEventsRef.current)
          }
          useEditorStore.getState().addMessage({
            id: uid(), role: 'assistant', content: '', timestamp: Date.now(), status: 'done',
            loopStop: {
              errorSummary: String(detail.error).slice(0, 300),
              attempts: seen,
              retryPrompt: `The app keeps hitting this error even after an auto-fix attempt: "${String(detail.error).slice(0, 180)}". Take a DIFFERENT approach: identify the component responsible and rewrite it from scratch as a complete <file> block instead of patching the failing line.`,
            },
          })
          return
        }
      }
      // Stop runaway self-heal: cap consecutive autofix passes per user turn.
      if (autofixCountRef.current >= MAX_AUTOFIX) {
        console.warn('[wyber] self-heal retry cap reached — stopping to protect credits')
        return
      }
      autofixCountRef.current += 1
      // Runtime-error self-heals stay OUT of the visible agent-team feed on
      // purpose — this used to synthesize a "preview error detected — fixing
      // automatically" event into the feed the user is already looking at, so
      // a build that appeared to finish would then sprout a new QA lane
      // announcing something had broken. That's the opposite of "run
      // silently" (the whole point of self-heal): the fix still happens
      // exactly as before, it just never narrates the failure it's covering
      // for. See the matching removed "fixed" event further down.
      // continuation: this is the user's own build still in flight (cut stream,
      // missing entry file, failed patches) → visible bubble + persisted receipt.
      // Untagged events (runtime-error self-heals from the preview) stay silent.
      executeGenerationRef.current?.(detail.prompt, null, { silent: true, continuation: !!detail.continuation })
    }
    window.addEventListener('wyber-autofix', autofixHandler)
    // Connector/theme panels send prompts via this event
    const chatPromptHandler = (e: Event) => {
      const prompt = (e as CustomEvent).detail
      if (typeof prompt === 'string' && prompt.trim()) {
        setInput(prompt)
        setTimeout(() => {
          const btn = document.querySelector('[data-send-button]') as HTMLButtonElement | null
          if (btn) btn.click()
        }, 100)
      }
    }
    window.addEventListener('wyber:chat-prompt', chatPromptHandler)
    // Agent-team steerability: fill the input WITHOUT sending (designSuggestion
    // contract) — used by SecurityReportCard's "Ask to fix" and future agent
    // action chips. Distinct from wyber:chat-prompt, which auto-sends.
    const fillInputHandler = (e: Event) => {
      const prompt = (e as CustomEvent).detail
      if (typeof prompt === 'string' && prompt.trim()) {
        setInput(prompt)
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('wyber-fill-input', fillInputHandler)
    // ConnectorsPanel sends this when a service needs a key we don't have yet —
    // opens the same inline vault-capture gate used for Supabase/Stripe, just
    // with the exact field names for that one connector instead of a keyword guess.
    const requestSecretsHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { prompt: string; group: { label: string; icon: string; color: string; keys: { name: string; placeholder: string }[] } } | undefined
      if (!detail?.group?.keys?.length) return
      const initialSecrets: Record<string, string> = {}
      for (const k of detail.group.keys) initialSecrets[k.name] = ''
      setInlineSecrets(initialSecrets)
      setPendingGenArgs({ prompt: detail.prompt, img: null, needsSupabase: false, needsStripe: false, composioTools: [], customGroup: detail.group })
    }
    window.addEventListener('wyber:request-secrets', requestSecretsHandler)
    return () => {
      window.removeEventListener('wyber_auto_generate', handler as EventListener)
      window.removeEventListener('wyber-autofix', autofixHandler)
      window.removeEventListener('wyber:chat-prompt', chatPromptHandler)
      window.removeEventListener('wyber-fill-input', fillInputHandler)
      window.removeEventListener('wyber:request-secrets', requestSecretsHandler)
    }
  }, []);

  // Upload an attachment to the project-assets bucket so generated code can use it
  // (logos/photos via URL, docs for download). Returns a promise tracked for send-gating.
  const uploadAsset = useCallback((file: File, localId: string) => {
    const p = (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${resolvedProjectId || 'anon'}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from('project-assets').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (error) { setAttachedFiles(prev => prev.map(f => f.localId === localId ? { ...f, uploading: false } : f)); return null; }
        const { data } = supabase.storage.from('project-assets').getPublicUrl(path);
        setAttachedFiles(prev => prev.map(f => f.localId === localId ? { ...f, url: data.publicUrl, uploading: false } : f));
        return data.publicUrl;
      } catch {
        setAttachedFiles(prev => prev.map(f => f.localId === localId ? { ...f, uploading: false } : f));
        return null;
      }
    })();
    uploadPromisesRef.current[localId] = p;
    return p;
  }, [resolvedProjectId]);

  // Accept any file: images become vision input + a usable asset; text/docs are
  // read for context; everything is uploaded so the build can reference it.
  const handleFile = useCallback((file: File) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      addMessage({ id: uid(), role: 'assistant', content: t('fileTooLargeMsg').replace('{name}', file.name), timestamp: Date.now(), status: 'done' });
      return;
    }
    const localId = uid();

    // .xlsx/.xls: Claude has no native way to read binary spreadsheets, so parse
    // every sheet to CSV client-side and route it through the same `text` kind
    // (attachedText) pipeline plain text files already use — no new server-side
    // handling needed for this one.
    if (isSpreadsheetFile(file)) {
      (async () => {
        try {
          const XLSX = await import('xlsx');
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array' });
          const text = wb.SheetNames
            .map(name => `--- Sheet: ${name} ---\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`)
            .join('\n\n')
            .slice(0, 20000);
          setAttachedFiles(prev => [...prev, { localId, name: file.name, mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', kind: 'text', size: file.size, text, uploading: true }]);
          uploadAsset(file, localId);
        } catch {
          addMessage({ id: uid(), role: 'assistant', content: t('spreadsheetReadErrorMsg').replace('{name}', file.name), timestamp: Date.now(), status: 'done' });
        }
      })();
      return;
    }

    // .pdf: Claude's Messages API reads PDFs natively as a document content
    // block (text, layout, tables) — no extraction needed, just send the bytes.
    if (isPdfFile(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachedFiles(prev => [...prev, { localId, name: file.name, mimeType: 'application/pdf', kind: 'pdf', size: file.size, base64: dataUrl.split(',')[1], uploading: true }]);
        uploadAsset(file, localId);
      };
      reader.readAsDataURL(file);
      return;
    }

    const kind: AttachedKind = file.type.startsWith('image/') ? 'image' : isTextFile(file) ? 'text' : 'file';
    if (kind === 'image') {
      const reader = new FileReader();
      setImageReading(true);
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachedImage({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type, name: file.name });
        setImageReading(false);
      };
      reader.onerror = () => setImageReading(false);
      reader.readAsDataURL(file);
      setAttachedFiles(prev => [...prev, { localId, name: file.name, mimeType: file.type, kind, size: file.size, uploading: true }]);
      uploadAsset(file, localId);
    } else if (kind === 'text') {
      const tr = new FileReader();
      tr.onload = (e) => {
        const text = (e.target?.result as string || '').slice(0, 20000);
        setAttachedFiles(prev => [...prev, { localId, name: file.name, mimeType: file.type || 'text/plain', kind, size: file.size, text, uploading: true }]);
        uploadAsset(file, localId);
      };
      tr.readAsText(file);
    } else {
      setAttachedFiles(prev => [...prev, { localId, name: file.name, mimeType: file.type, kind, size: file.size, uploading: true }]);
      uploadAsset(file, localId);
    }
  }, [uploadAsset, addMessage]);

  // Back-compat alias used by older call sites
  const handleImageFile = handleFile;

  const removeAttachedFile = useCallback((localId: string) => {
    setAttachedFiles(prev => {
      const target = prev.find(f => f.localId === localId);
      if (target?.kind === 'image') { setAttachedImage(null); setImageReading(false); }
      return prev.filter(f => f.localId !== localId);
    });
    delete uploadPromisesRef.current[localId];
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (imageItem) { const file = imageItem.getAsFile(); if (file) { e.preventDefault(); handleFile(file); } }
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    Array.from(e.dataTransfer.files || []).forEach(handleFile);
  }, [handleFile]);

  // A failed save used to be swallowed with `.catch(() => {})` — one network
  // blip and the whole build lived only in this tab's memory until it was
  // closed. Saves now retry with quick backoff, then keep retrying in the
  // background until they land, and the user is warned (once) so they don't
  // close the tab believing everything is safe. pendingSave always holds the
  // LATEST files, so overlapping saves collapse into "save the newest state".
  const pendingSave = useRef<typeof files | null>(null);
  const saveWarned = useRef(false);
  const saveRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against a second overlapping save loop. Staged agent-team builds
  // call saveProject once per pass (scaffold + up to 7 fill batches) — without
  // this, each call started its OWN independent retry loop, so multiple
  // unserialized PATCH requests raced each other and whichever happened to
  // land LAST won regardless of which pass it belonged to, silently
  // clobbering later passes' files with an earlier, incomplete snapshot
  // (root cause of publish shipping stale/incomplete apps after staged
  // builds). Now only one loop ever runs; new calls just bump pendingSave
  // and the active loop's next send picks up the latest state.
  const saveLoopActive = useRef(false);
  useEffect(() => () => { if (saveRetryTimer.current) clearTimeout(saveRetryTimer.current); }, []);

  const saveProject = useCallback((updatedFiles: typeof files) => {
    if (!resolvedProjectId) return;
    pendingSave.current = updatedFiles;
    if (saveLoopActive.current) return;
    saveLoopActive.current = true;
    if (saveRetryTimer.current) { clearTimeout(saveRetryTimer.current); saveRetryTimer.current = null; }

    // NOT sending expectedUpdatedAt here — this is the main chat/build save
    // path, and generate/route.ts has its own server-side rescue-persist
    // safety net (persistGeneratedFiles, via after()) for a DIFFERENT failure
    // mode (client dies mid-stream): it waits 8s after each generation call
    // and, if the client hasn't saved yet, writes the files itself, bumping
    // updated_at with zero coordination with the client's own tracked value.
    // Confirmed live: a fast staged build (several generate calls in quick
    // succession) can have rescue-persist land between this tab's OWN passes,
    // so this tab's own next save would see its own prior save's window get
    // silently invalidated and hit a false "changed in another tab" conflict
    // — for a write that was never in a different tab at all. Enforcing
    // optimistic concurrency here would require rescue-persist to participate
    // in the same versioning scheme too, which is a bigger, riskier change
    // than tonight's fix budget. The theme/image/version-restore paths below
    // (persist-project.ts) never trigger rescue-persist (they don't call
    // /api/generate), so they keep full conflict protection — this narrows
    // B3's guarantee to "not the main build flow, which has its own separate
    // protection for a different failure" rather than silently pretending
    // it's covered everywhere.
    const attempt = async (): Promise<'ok' | 'conflict' | 'fail'> => {
      const toSave = pendingSave.current;
      if (!toSave) return 'ok';
      try {
        const res = await fetch('/api/projects', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, files: toSave, userId: resolvedUserId || 'auto' }),
        });
        if (res.status === 409) return 'conflict';
        if (!res.ok) return 'fail';
        const data = await res.json().catch(() => null);
        if (data?.updatedAt) {
          const cur = useEditorStore.getState().project;
          if (cur?.id === resolvedProjectId) setProject({ ...cur, updated_at: data.updatedAt });
        }
        // Only clear if nothing newer queued while this request was in
        // flight — otherwise the loop below must keep going to flush that.
        if (pendingSave.current === toSave) pendingSave.current = null;
        return 'ok';
      } catch { return 'fail'; }
    };
    const onSaved = () => {
      if (saveWarned.current) {
        saveWarned.current = false;
        addMessage({ id: uid(), role: 'assistant', content: t('connectionRestoredMsg'), timestamp: Date.now(), status: 'done' });
      }
    };

    void (async () => {
      while (pendingSave.current) {
        let landed = false;
        let conflicted = false;
        for (const delay of [0, 2000, 6000]) {
          if (delay) await new Promise(r => setTimeout(r, delay));
          const result = await attempt();
          if (result === 'ok') { landed = true; onSaved(); break; }
          if (result === 'conflict') { conflicted = true; break; }
        }
        if (conflicted) {
          pendingSave.current = null;
          addMessage({ id: uid(), role: 'assistant', content: t('projectChangedConflictMsg'), timestamp: Date.now(), status: 'done' });
          break;
        }
        if (landed) continue; // pendingSave may already hold a newer pass — recheck
        if (!saveWarned.current) {
          saveWarned.current = true;
          addMessage({ id: uid(), role: 'assistant', content: t('cantReachServerMsg'), timestamp: Date.now(), status: 'done' });
        }
        let resolvedConflict = false;
        await new Promise<void>(resolve => {
          const retryLoop = async () => {
            const result = await attempt();
            if (result === 'ok') { onSaved(); resolve(); return; }
            if (result === 'conflict') {
              resolvedConflict = true;
              pendingSave.current = null;
              addMessage({ id: uid(), role: 'assistant', content: t('projectChangedConflictMsg'), timestamp: Date.now(), status: 'done' });
              resolve();
              return;
            }
            saveRetryTimer.current = setTimeout(retryLoop, 20_000);
          };
          saveRetryTimer.current = setTimeout(retryLoop, 20_000);
        });
        if (resolvedConflict) break;
      }
      saveLoopActive.current = false;
    })();
  }, [resolvedProjectId, resolvedUserId, addMessage, setProject]);

  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null, opts?: { silent?: boolean; continuation?: boolean; echoedUser?: boolean; displayContent?: string; paletteId?: string | null; stage?: 'scaffold' | 'fill' | 'agentFix'; stageFiles?: string[]; stagePurposes?: string[]; internalPass?: boolean; finalPass?: boolean; preserveAgentTurn?: boolean }) => {
    // Clear any stale progress steps/reasoning from a previous generation before starting
    setProgressSteps([]);
    setLiveReasoning('');
    // A fresh user-initiated turn resets the self-heal budget (silent autofix runs do not).
    if (!opts?.silent) { autofixCountRef.current = 0; loopGuardRef.current.reset(); }
    // A genuinely fresh visible turn — not a staged pass (stage set), not a
    // self-heal/autofix rerun (silent), not a truncated-stream continuation,
    // not runAgenticBuild's own fallback re-entry (preserveAgentTurn). This is
    // the one boundary PreviewPanel's self-heal budget should reset on too —
    // a staged build's per-stage isGenerating toggles are NOT turn boundaries.
    if (!opts?.silent && !opts?.continuation && !opts?.stage && !opts?.preserveAgentTurn) {
      bumpGenerationTurn();
    }
    if (AGENT_TEAM_ENABLED && !opts?.silent && !opts?.continuation && !opts?.stage && !opts?.preserveAgentTurn) {
      turnAgentEventsRef.current = [];
      agentPassCountRef.current = 0;
      turnCreditsRef.current = 0;
      useAgentTurnStore.getState().resetTurn();
    }

    // Out of credits → block builds/edits (self-heal is free, so let it through).
    // Conversational messages never reach here; they go through handleConversational.
    if (!opts?.silent && credits <= 0) {
      addMessage({ id: uid(), role: 'user', content: userMsg, timestamp: Date.now(), status: 'done' });
      addMessage({ id: uid(), role: 'assistant', content: t('outOfCreditsMsg'), timestamp: Date.now(), status: 'done' });
      return false;
    }

    // The funnel's missing middle event (project_created → app_published had no
    // signal in between): fires only for a real, user-initiated first build on a
    // brand-new project — never on edits or silent self-heal reruns.
    if (!opts?.silent && !opts?.continuation && Object.keys(files ?? {}).length === 0) {
      track('first_generation_started', { has_image: !!img });
    }

    // Snapshot current files for undo BEFORE generation
    if (Object.keys(files ?? {}).length > 0) pushCheckpoint((opts?.displayContent ?? userMsg).slice(0, 40) || 'Before edit');

    // Also persist this checkpoint to project_snapshots — the in-memory
    // checkpoint stack above is capped at 20 and gone on refresh/tab-close,
    // which silently breaks Undo mid-session. Reuses the same table/endpoint
    // TopBar's manual "Save Snapshot" already writes to, so it shows up in
    // that same restore list — no new schema, no new UI. Skipped for silent
    // self-heal reruns, staged sub-passes, and continuations: those aren't
    // turn boundaries a user would want to roll back to individually.
    if (Object.keys(files ?? {}).length > 0 && resolvedProjectId && !opts?.silent && !opts?.continuation && !opts?.stage && !opts?.preserveAgentTurn) {
      const filesPayload = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, (v as any).content ?? v]));
      fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: resolvedProjectId, label: `Before: ${(opts?.displayContent ?? userMsg).slice(0, 40) || 'edit'}`, files: filesPayload }),
      }).catch(() => {});
    }

    // Self-heal/autofix runs (silent) are FREE — they repair work the user
    // already paid for. Skip the optimistic client decrement; the server is
    // told `selfHeal: true` below and skips the deduction entirely.
    const isSelfHeal = !!opts?.silent;
    if (!isSelfHeal) consumeCredit();
    // displayContent lets a caller send a large/technical userMsg to the model
    // (e.g. an approved plan's full spec) while showing something clean and
    // readable as the user's own chat bubble — same distinction Claude.ai
    // draws between what you typed and what's actually in the context.
    const userContent = opts?.displayContent ?? (img ? `[Image: ${img.name}]\n${userMsg || 'Build a UI matching this screenshot'}` : userMsg);
    // echoedUser: the conversational lane already added the user's bubble before
    // it decided this was actually a build — don't duplicate it.
    if (!opts?.silent && !opts?.echoedUser) {
      const userMsgId = uid();
      addMessage({ id: userMsgId, role:'user', content: userContent, timestamp:Date.now(), status:'done' });
      persistMessage('user', userContent, undefined, userMsgId);
    }
const storeProjectId = useEditorStore.getState().project?.id;
  if (resolvedProjectId && storeProjectId && storeProjectId !== resolvedProjectId) {
    console.warn('Blocked generation: project mismatch');
    return false;
  }
    const assistantId = uid();
    // Continuation runs (batch 2+ of a build whose stream was cut, a missing
    // entry file, patches that didn't apply) are the user's own build still in
    // flight — they MUST stay visible: a streaming bubble while they run and a
    // persisted completion receipt when they land. Before this, they ran fully
    // silent: the preview changed minutes later with nothing in the chat, and
    // "is it done?" answered from a history that ended mid-build. Only pure
    // self-heals (runtime-error repairs fired from the preview) stay invisible.
    const isVisible = !opts?.silent || !!opts?.continuation;
    if (isVisible) {
      addMessage({ id: assistantId, role:'assistant', content:'', timestamp:Date.now(), status:'streaming' });
      // isGenerating drives the Stop button, the elapsed timer, the TopBar
      // "Building…" pill, the double-send guard, and the preview's rebuild-on-
      // finish. It was left permanently false when the staged-build path was
      // removed, so builds were unstoppable and showed no timer.
      setIsGenerating(true);
    }
    clearStreamingContent();
    setLastCreditCost(null);
    setLastModel(null);

    const promptLower = (userMsg || '').toLowerCase();
    const CORE_FILES = ['app.tsx', 'app.vue', 'index.html', 'index.css', 'app.css', 'main.tsx'];
    // Strip web-scaffold files from react-native context — they score 100 as CORE_FILES
    // but break mobile generation by causing the model to emit web code instead of RN.
    // src/App.tsx is the Vite/CRA entry point; RN always uses App.tsx at root.
    // Filtering src/App.tsx from broken old projects forces the model to regenerate
    // a proper App.tsx at root with StyleSheet/View/Text instead of following web code.
    const WEB_ONLY_FILES = new Set([
      'index.html', 'vite.config.ts', 'vite.config.js',
      'src/main.tsx', 'src/main.jsx',
      'src/App.tsx', 'src/App.jsx',
      'src/index.css', 'src/app.css',
    ]);
    const allFileEntries = Object.entries(files).filter(([p]) =>
      framework !== 'react-native' || !WEB_ONLY_FILES.has(p)
    );
    const scored = allFileEntries.map(([path, f]) => {
      const pathLower = path.toLowerCase();
      let score = CORE_FILES.some(c => pathLower.endsWith(c)) ? 100 : 0;
      promptLower.split(/\s+/).filter(w => w.length > 3).forEach(w => { if (pathLower.includes(w)) score += 20; });
      return { path, content: (f as any).content, score };
    });
    const topFiles = scored.sort((a,b) => b.score - a.score).slice(0, 6);
    // Pull in helper files imported by the top files (lib/api, Auth, hooks…) so
    // the model can edit them instead of recreating them. Capped to keep the
    // context bounded.
    const fileMap: Record<string, string> = {};
    for (const [p, f] of allFileEntries) fileMap[p] = (f as any).content ?? '';
    const seedPaths = topFiles.map(f => f.path);
    const importedPaths = collectImportedPaths(seedPaths, allFileEntries.map(([p]) => p), p => fileMap[p] ?? '', 8);
    const contextPaths = [...new Set([...seedPaths, ...importedPaths])].slice(0, 14);
    const contextFiles = contextPaths.map(p => ({ path: p, content: fileMap[p] ?? '' }));
    // Full manifest of EVERY existing file path. Without this the model only sees the
    // top-6 scored files, so on follow-up edits it can't see helper files (lib/api,
    // Auth, etc.) that App.tsx imports — and recreates them every turn in an infinite
    // loop. Listing all paths tells it what already exists so it edits instead.
    const allPaths = allFileEntries.map(([p]) => p);
    const manifest = allPaths.length
      ? `EXISTING FILES (already created — DO NOT recreate these; edit them if a change is needed):\n${allPaths.map(p => `- ${p}`).join('\n')}\n\n`
      : '';
    // Send FULL content of the most relevant files so the model can produce exact-match
    // SEARCH/REPLACE diffs. Truncating breaks diff editing (model can't match what it can't see).
    const fullBlock = contextFiles.map(({path, content}) => {
      const body = content.length > 12000 ? content.slice(0, 12000) + '\n/* ...truncated... */' : content;
      return `<file path="${path}">\n${body}\n</file>`;
    }).join('\n\n');
    // For every OTHER file (large apps have many), ship signatures only — the model
    // sees each file's API so it edits via exports instead of recreating blind.
    const contextSet = new Set(contextPaths);
    const outlineEntries = allFileEntries.filter(([p]) => !contextSet.has(p));
    const outlineBlock = outlineEntries.length
      ? '\n\nFILE OUTLINES (these files exist — signatures only; edit via their exports, never recreate):\n' +
        outlineEntries.map(([p, f]) => `<outline path="${p}">\n${extractSignatures((f as any).content ?? '')}\n</outline>`).join('\n')
      : '';
    const fileContext = manifest + fullBlock + outlineBlock;
    const history = windowedHistory(messages.filter(m => m.status==='done')).map(m => ({ role:m.role, content:m.content }));

    // Knowledge from store (per-project, Lovable-style), with localStorage fallback
    let knowledgeStr = knowledge || '';
    if (!knowledgeStr) {
      try {
        const k = localStorage.getItem('wyber_knowledge');
        if (k) {
          const obj = JSON.parse(k);
          knowledgeStr = Object.entries(obj).filter(([,v]) => (v as string).trim()).map(([key,val]) => `${key}: ${val}`).join('\n');
        }
      } catch {}
    }
    if (knowledgeStr) knowledgeStr = `\n\nCUSTOM PROJECT KNOWLEDGE:\n${knowledgeStr}`;

    // Gather uploaded attachments (assets the model can use + extracted doc text).
    // Wait for any in-flight uploads so their URLs are included this turn.
    let assets: { name: string; url: string; kind: string }[] = [];
    let attachedTextPayload: { name: string; content: string }[] = [];
    let attachedDocuments: { name: string; base64: string }[] = [];
    if (!isSelfHeal) {
      const pending = Object.values(uploadPromisesRef.current);
      if (pending.length) { try { await Promise.allSettled(pending); } catch {} }
      const af = attachedFilesRef.current;
      assets = af.filter(f => f.url).map(f => ({ name: f.name, url: f.url!, kind: f.kind }));
      attachedTextPayload = af.filter(f => f.kind === 'text' && f.text).map(f => ({ name: f.name, content: f.text! }));
      // PDFs go to Claude as native document content blocks (see /api/generate) —
      // sent separately from attachedText since they're binary, not extracted text.
      attachedDocuments = af.filter(f => f.kind === 'pdf' && f.base64).map(f => ({ name: f.name, base64: f.base64! }));
      if (af.length) { setAttachedFiles([]); uploadPromisesRef.current = {}; }
    }

    // Server gives up at maxDuration=800s (see /api/generate) — without a
    // client-side ceiling too, a dropped connection or a server that hangs
    // after sending headers left the UI spinning "Applying changes..."
    // forever with no way out but a page reload. 20s past the server's own
    // limit so a legitimately-still-running build isn't cut off early. Lives in
    // a ref (not a local const) so the user-facing Stop button can reach it.
    userStoppedRef.current = false;
    if (dropReloadTimerRef.current) { clearTimeout(dropReloadTimerRef.current); dropReloadTimerRef.current = null; }
    const genController = new AbortController();
    abortControllerRef.current = genController;
    const genTimeout = setTimeout(() => genController.abort(), 820_000);
    // Keep the machine awake during the (minutes-long) build stream — a laptop
    // dozing off mid-stream kills the fetch with ERR_NETWORK_IO_SUSPENDED and
    // the whole generation is lost from the client's point of view. Best-effort:
    // unsupported browsers just skip it (the server-side rescue-persist in
    // /api/generate still saves the finished build for a dead client).
    let wakeLock: { release: () => Promise<void> } | null = null;
    try {
      wakeLock = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
    } catch { /* denied or unsupported — fine */ }
    // Reports whether this pass actually produced a real file change, so a
    // multi-stage caller (runAgenticBuild's fill-batch loop) can stop instead
    // of building further passes on top of a batch that silently failed. A
    // bare `return;` exits the function immediately with `undefined` — it does
    // NOT fall through to the `return succeeded` after the try/finally below —
    // so every early-exit path in this function explicitly `return false`s.
    // succeeded only flips true right before the try block's normal exit.
    let succeeded = false;
    try {
      const res = await fetch('/api/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        signal: genController.signal,
        body: JSON.stringify({
          prompt: userMsg || (img ? 'Build a UI matching this screenshot exactly.' : 'Build this using the attached files.'),
          // Only send a tier once the user has actually picked one — otherwise
          // the server's own complexity-aware auto-routing (resolveModelTier)
          // stays in control, same as before the picker existed.
          framework, fileContext, history, knowledge: knowledgeStr, modelTier: tierTouched ? modelTier : undefined,
          userId: resolvedUserId, projectId: resolvedProjectId,
          projectType, selfHeal: isSelfHeal,
          // The server can't infer "first build" from fileContext — the
          // auto-seeded starter scaffold makes it non-empty on the very first
          // message, so its length heuristic classified EVERY build as an
          // edit (wrong price, Sonnet instead of Opus, no naming pass). Sent
          // explicitly from the store's per-project flag instead.
          isFirstBuild: !useEditorStore.getState().hasGeneratedFiles,
          // Design direction the user picked on the plan/offer cards — the
          // server silently falls back to its prompt-matched pick when absent.
          paletteId: opts?.paletteId || undefined,
          // Agentic staged passes (flag-gated): scaffold/fill batch scoping +
          // the internal-pass free-lane marker (honored server-side only for
          // fill/agentFix, counted by the hourly free-pass guard).
          stage: opts?.stage || undefined,
          stageFiles: opts?.stageFiles?.length ? opts.stageFiles : undefined,
          stagePurposes: opts?.stagePurposes?.length ? opts.stagePurposes : undefined,
          internalPass: opts?.internalPass || undefined,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
          assets: assets.length ? assets : undefined,
          attachedText: attachedTextPayload.length ? attachedTextPayload : undefined,
          documents: attachedDocuments.length ? attachedDocuments : undefined,
        }),
      });

      if (!res.ok) {
        // A session that expires mid-use used to surface here as a raw
        // '{"error":"Unauthorized"}' string dumped into the chat with no
        // indication of what happened or what to do — the generic error path
        // below. 401 specifically means "log in again", not "something broke".
        if (res.status === 401) {
          throw new Error('SESSION_EXPIRED');
        }
        // Parse 402 credit errors
        const errText = await res.text();
        if (res.status === 402) {
          try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.error || 'Not enough credits');
          } catch { throw new Error('Not enough credits for this action'); }
        }
        throw new Error(errText);
      }

      const xSource = res.headers.get('X-Source');
      const creditsUsed = res.headers.get('X-Credits-Used');
      const modelUsed = res.headers.get('X-Model-Used');
      // Honest DB state: the server connected (or tried to) the user's Supabase.
      // 'error' = a connector exists but we couldn't reach/use it — warn instead
      // of letting the app silently build with no working database.
      const supabaseStatus = res.headers.get('X-Supabase-Status');
      const generationTruncated = res.headers.get('X-Generation-Truncated') === '1';
      if (creditsUsed) setLastCreditCost(parseInt(creditsUsed));
      if (creditsUsed) turnCreditsRef.current += parseInt(creditsUsed) || 0;
      if (modelUsed) setLastModel(modelUsed);

      // Server already deducted credits before streaming. Refresh balance from API.
      const isPrebuilt = xSource === 'prebuilt';
      if (isPrebuilt) {
        // Prebuilt is free — restore the optimistic deduction the store may have applied
        useEditorStore.getState().setCredits(credits);
      } else {
        // Fetch fresh balance (+ plan, in case of a mid-session upgrade) after server deduction
        fetch('/api/credits/deduct', { method: 'GET' })
          .then(r => r.json())
          .then(data => {
            if (data.credits !== undefined) useEditorStore.getState().setCredits(data.credits);
            if (data.plan) setUserPlan(data.plan);
          })
          .catch(() => {});
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream:true });

        // Extract [progress: ...] markers and surface them live
        const steps = extractProgressLines(full);
        // Deterministic batch notice for big builds: the system prompt asks the
        // model to announce >5-file builds, but this guarantees the user is told
        // regardless — pinned as the first progress line for the whole stream.
        const fileTagCount = (full.match(/<file path="/g) || []).length;
        const batchNotice = fileTagCount > 5
          ? [t('bigBuildNoticeMsg').replace('{count}', String(fileTagCount))]
          : [];
        if (steps.length > 0 || batchNotice.length > 0) setProgressSteps([...batchNotice, ...steps]);

        // Live extended-thinking text (opt-in, new-build full generation only)
        const reasoningSoFar = extractReasoning(full);
        if (reasoningSoFar) setLiveReasoning(reasoningSoFar);

        // Agent-team feed: server-authored [agent:{...}] events render live on
        // top of the turn's accumulated events (see agent-turn store).
        if (AGENT_TEAM_ENABLED) {
          const liveAgentEvents = extractAgentEvents(full);
          if (liveAgentEvents.length || turnAgentEventsRef.current.length) {
            useAgentTurnStore.getState().setEvents([...turnAgentEventsRef.current, ...liveAgentEvents]);
          }
        }

        const cleanedFull = cleanStreamingDisplay(full)
          .replace(/<agent>[\s\S]*?<\/agent>/g, '')
          .replace(/<flow>[\s\S]*?<\/flow>/g, '')
          // Strip [progress: ...] tags from visible chat text
          .replace(/\[progress:[^\]]+\]/gi, '')
          .trim();
        setStreamingContent(cleanedFull || '');
      }
      const { files: newFiles, chatText } = parseGenerationOutput(full);
      const editBlocks = parseEditBlocks(full);
      // Fold this pass's agent events into the turn's accumulated list so they
      // survive into the next pass / the final receipt.
      if (AGENT_TEAM_ENABLED) {
        const passAgentEvents = extractAgentEvents(full);
        if (passAgentEvents.length) pushAgentEvents(...passAgentEvents);
      }
      // Self-heal: if the stream was cut off mid-file or mid-edit, request the rest
      const lastFileOpen = full.lastIndexOf('<file path="');
      const lastEditOpen = full.lastIndexOf('<edit path="');
      const fileCut = lastFileOpen !== -1 && full.indexOf('</file>', lastFileOpen) === -1;
      const editCut = lastEditOpen !== -1 && full.indexOf('</edit>', lastEditOpen) === -1;
      if (fileCut || editCut) {
        const cutAt = fileCut ? lastFileOpen : lastEditOpen;
        const cm = full.slice(cutAt).match(/path="([^"]+)"/);
        const cutPath = cm ? cm[1] : 'the last file';
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            detail: { continuation: true, prompt: `Your previous output was cut off before finishing. Output the COMPLETE <file> block (full contents, not a diff) for: ${cutPath}. Then output any other files from your plan that were never emitted, each as a complete <file> block.` }
          }));
        }, 600);
      }
      let updatedFiles = { ...files };
      const langMap: Record<string,string> = { ts:'typescript', tsx:'typescript', js:'javascript', jsx:'javascript', css:'css', html:'html', json:'json', vue:'vue' };
      // 1. Apply full <file> blocks (new files or full rewrites)
      if (newFiles.length > 0) {
        for (const { path, content } of newFiles) {
          const ext = path.split('.').pop() ?? '';
          updatedFiles[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
        }
      }
      // 2. Apply <edit> diff blocks (fast path)
      let failedPaths: string[] = [];
      if (editBlocks.length > 0) {
        const result = applyEdits(updatedFiles, editBlocks);
        for (const [path, content] of Object.entries(result.updated)) {
          const ext = path.split('.').pop() ?? '';
          updatedFiles[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
        }
        failedPaths = result.failedPaths;
      }
      // 3. Sanitize — strip any stray merge conflict markers the AI left behind
      for (const [path, file] of Object.entries(updatedFiles)) {
        const c = typeof file === 'string' ? file : (file as any)?.content
        if (c && (c.includes('<<<<<<<') || c.includes('=======') || c.includes('>>>>>>>'))) {
          const cleaned = c.replace(/^<<<<<<<.*$/gm, '').replace(/^=======\s*$/gm, '').replace(/^>>>>>>>.*$/gm, '')
          // Write a NEW object — store file objects are frozen (Immer), so
          // mutating `file.content` in place throws "Cannot assign to read only
          // property 'content'". Replace the entry instead.
          if (typeof file === 'string') updatedFiles[path] = cleaned
          else updatedFiles[path] = { ...(file as any), content: cleaned }
        }
      }
      // 4. Persist if anything changed
      if (newFiles.length > 0 || editBlocks.length > 0) {
        setFiles(updatedFiles);
        setHasGeneratedFiles(true);
        await saveProject(updatedFiles);
      }
      // 4b. Safety net for the failure the server's forced follow-up also
      // guards: a "successful" build whose files never included a real entry
      // file. If the model wrote components but App is still missing or still
      // the starter placeholder, the preview stays blank forever with no error
      // to heal from. isPlaceholderApp (marker + length, NOT length alone —
      // the old <=200 check silently never fired because the starter
      // placeholder had grown past 200 chars) detects it; ask for exactly the
      // missing file via the free self-heal lane.
      const appAfter = (updatedFiles['src/App.tsx'] || updatedFiles['src/App.jsx'] || updatedFiles['App.tsx']) as { content?: string } | undefined
      if (newFiles.length >= 2 && !isSelfHeal && !fileCut && !editCut && isPlaceholderApp(appAfter?.content)) {
        const entry = projectType === 'mobile' ? 'App.tsx' : 'src/App.tsx'
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            detail: { continuation: true, prompt: `The build finished but ${entry} was never written (or is still the empty placeholder), so the app cannot render. Output the COMPLETE <file> block for ${entry}, wiring together the components that already exist. Do not rewrite other files.` }
          }));
        }, 600);
      }

      // 4b². Verity's deterministic QA pass (flag-gated): structural checks
      // the preview can't surface as runtime errors — sanitize-files stubs
      // broken imports at build time, so those features die SILENTLY instead
      // of erroring. Final pass only: mid-staging batches legitimately import
      // files a later batch will write. missing-entry is filtered because the
      // placeholder check above (and the server's forced follow-up) own that.
      // Runs on non-silent passes AND the final staged fill (which is silent
      // by design) — but never on the QA fix pass itself (silent, no stage),
      // so a failed fix can't loop.
      const qaEligible = !isSelfHeal || (opts?.stage === 'fill' && !!opts?.finalPass)
      if (AGENT_TEAM_ENABLED && qaEligible && !fileCut && !editCut
          && (!opts?.stage || opts?.finalPass)
          && (newFiles.length > 0 || editBlocks.length > 0)) {
        const qaIssues = runQaChecks(updatedFiles, projectType).filter(i => i.kind !== 'missing-entry')
        if (qaIssues.length > 0) {
          // Deliberately silent, same as the runtime self-heal above: this is
          // still a free, invisible fix pass, but it no longer pushes each
          // finding + a "structural issue(s) found — fixing" summary into the
          // feed the user is looking at right after their build finished —
          // that made a normal-looking build sprout a list of problems it
          // supposedly just had, right as it wrapped up.
          const combined = qaIssues.slice(0, 4).map(i => i.fixPrompt).join('\n')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('wyber-autofix', {
              detail: { continuation: true, qaFix: true, prompt: combined }
            }))
          }, 700)
        } else {
          pushAgentEvents({ agent: 'qa', status: 'done', detail: t('qaPassedMsg') })
        }
      }

      // 4c. Auto-apply the generated database schema. Supabase builds end with
      // a "SQL TO RUN IN SUPABASE DASHBOARD" comment block — historically the
      // user had to copy it into the SQL editor by hand, and nobody did, so
      // every insert hit a missing table and silently failed ("frontend works,
      // backend doesn't"). OAuth-connected projects get it run automatically
      // via the Management API; anon-key-only connections get the SQL surfaced
      // as an explicit action item instead of buried in generated code.
      const sqlMatch = full.match(/\/\*\s*SQL TO RUN IN (?:SUPABASE|WYBERCLOUD)[^\n]*\n([\s\S]*?)\*\//i)
      // Fallback: tool-use builds sometimes write the schema as a .sql file
      // instead of the chat comment block — only files written THIS turn
      // count, so old schema files never re-trigger on unrelated edits.
      const sqlFileThisTurn = newFiles.find(f => f.path.endsWith('.sql'))
      // The model sometimes leaks markdown fences (```sql / ```) INSIDE the
      // schema comment block — even mid-line — and unsanitized they break both
      // the Management-API auto-apply and the SQL the user copies into the
      // Supabase editor (ERROR 42601: syntax error at or near "```").
      // Backticks are never valid Postgres SQL, so stripping the token
      // anywhere is safe.
      const schemaSql = (sqlMatch?.[1] ?? sqlFileThisTurn?.content ?? '')
        .replace(/```[\w-]*/g, '')
        .trim()
      if (schemaSql && resolvedProjectId && wyberCloudConnected && !supabaseConnected) {
        // WyberCloud-connected project: same schema-comment-block convention,
        // different backend — apply-schema here always has real credentials
        // (no OAuth concept), so the only real failure modes are "still
        // provisioning" (no cloud_databases row yet) and a genuine SQL error.
        fetch('/api/cloud/apply-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, sql: schemaSql }),
        }).then(r => r.json()).then((d: { applied?: boolean; reason?: string; error?: string }) => {
          if (d.applied) {
            addMessage({ id: uid(), role: 'assistant', content: t('dbSetupAutoMsgCloud'), timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'no-cloud-database' || d.reason === 'no-credentials') {
            addMessage({ id: uid(), role: 'assistant', content: t('dbCloudNotReadyMsg') + '\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'sql-error') {
            addMessage({ id: uid(), role: 'assistant', content: t('dbSqlErrorMsgCloud') + '\n\n```\n' + (d.error || 'unknown') + '\n```\n\n' + t('dbSqlErrorRunInsteadMsgCloud') + '\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
          }
        }).catch(() => { /* best-effort — the SQL block is still in the transcript */ });
      } else if (schemaSql && resolvedProjectId) {
        fetch('/api/connectors/supabase/apply-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, sql: schemaSql }),
        }).then(r => r.json()).then((d: { applied?: boolean; reason?: string; error?: string }) => {
          if (d.applied) {
            addMessage({ id: uid(), role: 'assistant', content: t('dbSetupAutoMsg'), timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'oauth-expired') {
            addMessage({ id: uid(), role: 'assistant', content: t('dbOauthExpiredMsg') + '\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'no-oauth') {
            addMessage({ id: uid(), role: 'assistant', content: t('dbNoOauthMsg') + '\n\n```sql\n' + schemaSql + '\n```\n\n' + t('dbNoOauthTipMsg'), timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'sql-error') {
            addMessage({ id: uid(), role: 'assistant', content: t('dbSqlErrorMsg') + '\n\n```\n' + (d.error || 'unknown') + '\n```\n\n' + t('dbSqlErrorRunInsteadMsg') + '\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
          }
          // reason 'not-connected' → mock-data app, nothing to apply
        }).catch(() => { /* best-effort — the SQL block is still in the transcript */ });
      }

      // 4. Fallback: any patch that didn't match → ask AI for the full file
      if (failedPaths.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            detail: { continuation: true, prompt: `Some edits could not be applied automatically. Output the COMPLETE updated <file> block (full file contents, not a diff) for each of these files: ${failedPaths.join(', ')}` }
          }));
        }, 400);
      }

      // Post-prebuilt dep nudge: scan applied code for service references.
      // Fires AFTER files are applied so it never blocks. Prebuilt check is
      // identified by X-Source: prebuilt header.
      if (isPrebuilt && newFiles.length > 0) {
        const allCode = newFiles.map(f => f.content).join('\n');
        const codeDeps = detectDepsInCode(allCode);
        if (codeDeps.needsSupabase) {
          setTimeout(() => {
            addMessage({
              id: uid(), role: 'assistant',
              content: t('templateNeedsSupabaseMsg'),
              timestamp: Date.now(), status: 'done',
            });
          }, 400);
        } else if (codeDeps.needsStripe) {
          setTimeout(() => {
            addMessage({
              id: uid(), role: 'assistant',
              content: t('templateIncludesStripeMsg'),
              timestamp: Date.now(), status: 'done',
            });
          }, 400);
        }
      }

      // Honest-error: a build/edit turn is only a real success if it actually produced
      // a file or edit block. Checking ONLY for empty text (as this used to) misses the
      // worse case — the model writes a confident "I did X" narrative with zero real
      // <file>/<edit> blocks, which used to sail through as a verified "Built:" summary
      // (confirmed live: a turn claimed "Loaded all 50 restaurants" while nothing in the
      // app changed). The server mirrors this same check before deciding whether to
      // refund (see generate/route.ts), so this case is never silently charged either.
      const hasRealChange = newFiles.length > 0 || editBlocks.length > 0;
      if (!hasRealChange) {
        if (isVisible) {
          const emittedNothing = full.trim().length === 0;
          const errMsg = (fileCut || editCut)
            ? t('streamCutOffMsg')
            : emittedNothing
            ? t('emptyResponseMsg')
            : t('nothingChangedMsg');
          updateMessage(assistantId, { content: errMsg, status: (fileCut || editCut) ? 'done' : 'error', retryPrompt: userMsg, retryLane: 'build' });
          persistMessage('assistant', errMsg);
        }
        setLiveReasoning('');
        return false;
      }

      // Always run through cleanMessage so stored content is already scrubbed.
      // cleanMessage never returns empty (it has its own generic fallback) —
      // swap that fallback for a continuation-specific receipt when this run
      // was finishing a cut build, so the chat says what actually happened.
      let finalContent = cleanMessage(chatText, t('doneCheckPreviewMsg'));
      if (opts?.continuation && finalContent === t('doneCheckPreviewMsg')) {
        finalContent = t('continuationDoneMsg');
      }
      // A cut stream means the turn ends mid-work — say so, or the preamble
      // reads as a finished summary ("…Let me look at App.tsx:") and the user
      // waits on nothing. The continuation that follows is a visible bubble.
      if (fileCut || editCut) {
        finalContent += '\n\n' + t('hitOutputLimitMsg');
      }
      // Extended-thinking output (opt-in, new-build full generation only) — kept
      // client-side only for this session's collapsible display, not persisted
      // to project_messages (no schema for it yet, and it's not needed on reload).
      const finalReasoning = extractReasoning(full);
      // Deliberately no "fixed" event here for a successful runtime-error
      // self-heal — see the matching removed "fixing" event above. Neither
      // end of a self-heal shows up in the feed or the turn receipt; the
      // build just looks like it always worked.
      // Turn receipt: attached once per turn — on the last orchestrated pass,
      // or on any non-orchestrated visible pass that produced agent events.
      const attachReport = AGENT_TEAM_ENABLED && isVisible
        && turnAgentEventsRef.current.length > 0
        && (!opts?.stage || opts?.finalPass);
      const agentReport = attachReport
        ? buildAgentReport(turnAgentEventsRef.current, agentPassCountRef.current, turnCreditsRef.current || undefined, t)
        : undefined;
      if (isVisible) {
        updateMessage(assistantId, {
          content: finalContent,
          status:'done',
          filesChanged: newFiles.map(f => f.path),
          reasoning: finalReasoning || undefined,
          agentReport,
        });
        persistMessage('assistant', finalContent, newFiles.map(f => f.path));
      }
      // Design-quality advisory — heuristic-only, non-blocking, never
      // persisted (same treatment as `reasoning` above). !isSelfHeal and
      // !hasGeneratedFiles mirror the exact gates already used for the
      // first-build rename below, so this can only ever fire on a genuine
      // fresh build's own success — never on a self-heal/autofix/
      // continuation pass. See design-quality-check.ts for the safety
      // argument (it never imports sanitize-files.ts or stub-missing-imports.ts).
      if (isVisible && !isSelfHeal && !hasGeneratedFiles) {
        const suggestion = assessDesignFreshness(updatedFiles, projectType);
        // Prism's turn in the feed: the design check IS the design agent's
        // deterministic pass — narrate its outcome either way.
        if (AGENT_TEAM_ENABLED) {
          pushAgentEvents(suggestion
            ? { agent: 'design', status: 'finding', detail: suggestion.label, severity: 'low' }
            : { agent: 'design', status: 'done', detail: t('designCheckPassedMsg') });
        }
        if (suggestion) {
          addMessage({
            id: uid(), role: 'assistant', timestamp: Date.now(), status: 'done',
            content: suggestion.note,
            designSuggestion: { prompt: suggestion.prompt, label: suggestion.label },
          });
        }
      }
      setLiveReasoning('');

      // The project row is created with a 40-char slice of the raw prompt as its
      // name, and the server's Haiku rename (nameNewProject, in generate/route.ts's
      // after() hook) only updates the DB — nothing here was ever refetching it, so
      // the raw-prompt name stayed on screen for the rest of the session. `hasGeneratedFiles`
      // here is the value captured in this closure BEFORE this build ran, so `!hasGeneratedFiles`
      // means this was the project's first build — the one case the rename actually fires for.
      if (!hasGeneratedFiles && resolvedProjectId && !opts?.silent) {
        (async () => {
          try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            // Small delay: the rename runs in the server's after() hook, which
            // fires post-response — give it a moment to land before refetching.
            await new Promise(r => setTimeout(r, 2500));
            const { data } = await supabase.from('projects').select('name').eq('id', resolvedProjectId).single();
            if (data?.name && project && data.name !== project.name) {
              setProject({ ...project, name: data.name });
            }
          } catch { /* best-effort — worst case the name just stays as-is */ }
        })();
      }

      // Honest DB warning — connector exists but the server couldn't use it.
      if (supabaseStatus === 'error' && !opts?.silent) {
        setTimeout(() => {
          addMessage({
            id: uid(), role: 'assistant',
            content: t('supabaseUnreachableMsg'),
            timestamp: Date.now(), status: 'done',
          });
        }, 300);
      }

      // GPT-tier turn hit its tool-call iteration cap mid-build — some files
      // may already be in, but the turn may be incomplete. Charge already
      // stands (see server); this just tells the user so they can ask for a
      // follow-up rather than assume the build finished clean.
      if (generationTruncated && !opts?.silent) {
        setTimeout(() => {
          addMessage({
            id: uid(), role: 'assistant',
            content: t('gptTruncatedMsg'),
            timestamp: Date.now(), status: 'done',
          });
        }, 300);
      }

      succeeded = true;
    } catch (err: unknown) {
      if (isVisible) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        // A session that expires mid-use (long-lived tab, token revoked) used
        // to hit the generic fallback below and show a raw '{"error":
        // "Unauthorized"}' string with no indication of what to actually do —
        // the user had no way to tell "your login expired" apart from "the
        // server broke". Give it a specific, actionable message instead.
        const isSessionExpired = err instanceof Error && err.message === 'SESSION_EXPIRED';
        // fetch() surfaces a dropped connection (sleep/suspend, wifi drop, VPN
        // blip) as a bare TypeError — the build usually FINISHES on the server
        // and rescue-persist saves it, so point the user at reload, not retry.
        const isNetworkDrop = !isAbort && err instanceof TypeError;
        const errMsg = isSessionExpired
          ? t('sessionExpiredBuildMsg')
          : isAbort
          ? (userStoppedRef.current
              ? t('stoppedByUserMsg')
              : t('buildTimedOutMsg'))
          : isNetworkDrop
          ? t('connectionDroppedMsg')
          : `${t('errorPrefix')} ${err instanceof Error ? err.message : t('unknownErrorLabel')}`;
        updateMessage(assistantId, { content: errMsg, status:'error', retryPrompt: userMsg, retryLane: 'build' });
        if (isNetworkDrop) {
          if (dropReloadTimerRef.current) clearTimeout(dropReloadTimerRef.current);
          dropReloadTimerRef.current = setTimeout(() => {
            dropReloadTimerRef.current = null;
            window.location.reload();
          }, 35_000);
        }
        persistMessage('assistant', errMsg);
      }
    } finally {
      clearTimeout(genTimeout);
      wakeLock?.release().catch(() => {});
      if (abortControllerRef.current === genController) abortControllerRef.current = null;
      // Only the run that set isGenerating clears it — an invisible self-heal
      // finishing in the background must not flip a visible build's state off.
      if (isVisible) setIsGenerating(false);
      clearStreamingContent();
      setProgressSteps([]);
    }
    return succeeded;
  }, [credits, files, messages, framework, resolvedProjectId, resolvedUserId, modelTier, tierTouched, knowledge, addMessage, updateMessage, setIsGenerating, bumpGenerationTurn, setStreamingContent, clearStreamingContent, consumeCredit, setFiles, hasGeneratedFiles, setHasGeneratedFiles, saveProject, persistMessage, pushCheckpoint, project, setProject, pushAgentEvents]);

  // Assign on every render so the autofix event handler always has the latest closure
  executeGenerationRef.current = executeGeneration;

  // ── Agentic staged build: Atlas plans → Forge scaffolds (the one charged
  // pass) → Forge fills in free internal batches, Sentinel reviewing every
  // pass server-side. Falls back to the classic one-shot build whenever the
  // plan is missing or small — the fallback still shows the team feed via the
  // server's coder/security events. Flag-gated by NEXT_PUBLIC_AGENT_TEAM.
  const runAgenticBuild = useCallback(async (userMsg: string, img: AttachedImage | null, paletteId?: string | null) => {
    turnAgentEventsRef.current = [];
    agentPassCountRef.current = 0;
    turnCreditsRef.current = 0;
    useAgentTurnStore.getState().resetTurn();
    pushAgentEvents({ agent: 'planner', status: 'start', detail: t('mappingBuildMsg') });

    // Atlas: the plan pass — a JSON file manifest, free (stage:'plan' skips
    // billing server-side). Best-effort: any failure falls back to one-shot.
    let staged: ReturnType<typeof buildStagedPlan> | null = null;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg, stage: 'plan', projectType,
          userId: resolvedUserId, projectId: resolvedProjectId,
          isFirstBuild: true,
        }),
      });
      if (res.ok) {
        const manifest = parsePlanManifest(await res.text());
        if (manifest.length) staged = buildStagedPlan(manifest);
      }
    } catch { /* plan pass is best-effort */ }

    if (!staged || !staged.shouldStage) {
      pushAgentEvents({ agent: 'planner', status: 'done', detail: staged ? t('compactBuildMsg') : t('buildingOnePassMsg') });
      await executeGenerationRef.current?.(userMsg, img, { paletteId, preserveAgentTurn: true });
      return;
    }
    pushAgentEvents({ agent: 'planner', status: 'done', detail: t('filesPlannedMsg').replace('{count}', String(staged.files.length)) });

    // Forge: scaffold — the single charged pass; shell/theme/nav so the
    // preview renders a skeleton right away.
    const hasFills = staged.fillBatches.length > 0;
    // Show actual planned total (scaffold + fills), not the ceiling MAX_INTERNAL_PASSES,
    // so the progress counter reads "2 of 4" not "2 of 8" for a 4-pass plan.
    const totalPassesPlanned = staged.fillBatches.length + 1;
    agentPassCountRef.current += 1;
    useAgentTurnStore.getState().setPasses(agentPassCountRef.current, totalPassesPlanned);
    const scaffoldOk = await executeGenerationRef.current?.(userMsg, img, {
      paletteId, stage: 'scaffold', stageFiles: staged.scaffoldPaths, finalPass: !hasFills,
    });
    // A failed scaffold means there's no skeleton for fill batches to build
    // on — piling more passes on top of a pass that produced no real files
    // (or errored) just multiplies wasted model calls on top of broken state.
    // executeGeneration already surfaced the failure to the user (an error
    // bubble or a "nothing changed" message); stop here instead.
    if (scaffoldOk === false) {
      pushAgentEvents({ agent: 'orchestrator', status: 'stuck', detail: t('scaffoldFailedMsg') });
      return;
    }

    // Forge: fill batches — free internal passes, visible as continuation
    // bubbles (the established multi-part-build UX). Budget-capped.
    for (let i = 0; i < staged.fillBatches.length; i++) {
      if (agentPassCountRef.current >= MAX_INTERNAL_PASSES) {
        pushAgentEvents({ agent: 'orchestrator', status: 'stuck', detail: t('passBudgetReachedMsg') });
        break;
      }
      const batch = staged.fillBatches[i];
      agentPassCountRef.current += 1;
      useAgentTurnStore.getState().setPasses(agentPassCountRef.current, totalPassesPlanned);
      pushAgentEvents({ agent: 'coder', status: 'progress', detail: forgeLine(batch, 'fill'), pass: agentPassCountRef.current });
      // Let React flush the previous pass's setFiles so the ref-latest closure
      // sees the newest files as fileContext (same reason autofix delays).
      await new Promise(r => setTimeout(r, 300));
      const batchPaths = batch.map(f => f.path);
      const batchPurposes = batch.map(f => f.purpose);
      let batchOk = await executeGenerationRef.current?.(userMsg, null, {
        silent: true, continuation: true,
        stage: 'fill', stageFiles: batchPaths, stagePurposes: batchPurposes, internalPass: true,
        finalPass: i === staged.fillBatches.length - 1,
      });
      // Retry once on failure — transient API errors, network blips, and
      // rare empty model responses succeed on a second attempt. Silently
      // retry before giving up so a single bad request doesn't leave the
      // app with missing screens.
      if (batchOk === false) {
        await new Promise(r => setTimeout(r, 1200));
        batchOk = await executeGenerationRef.current?.(userMsg, null, {
          silent: true, continuation: true,
          stage: 'fill', stageFiles: batchPaths, stagePurposes: batchPurposes, internalPass: true,
          finalPass: i === staged.fillBatches.length - 1,
        });
      }
      if (batchOk === false) {
        const remaining = staged.fillBatches.length - i - 1;
        pushAgentEvents({
          agent: 'orchestrator', status: 'stuck',
          detail: remaining > 0
            ? t('fillBatchStoppedMsg').replace('{count}', String(remaining)).replace('{plural}', remaining === 1 ? '' : 'es')
            : t('lastFillBatchStoppedMsg'),
        });
        break;
      }
    }
  }, [projectType, resolvedUserId, resolvedProjectId, pushAgentEvents]);

  // The ONE entry point for "start a build/edit now" — the agentic staged
  // path for first builds (flag-gated), the classic single request otherwise.
  // Every lane that kicks off generation (dispatchTurn, the dep-gate's Save
  // keys & build / Build without backend resumes) must go through here, or it
  // silently bypasses the agent team. Screenshot/attachment builds skip
  // staging: the plan pass can't see the image, so its manifest would be a
  // blind guess. Defined ABOVE its callers so their useCallback dep arrays
  // never hit the const's temporal dead zone.
  const startGeneration = useCallback(async (content: string, img: AttachedImage | null, paletteId?: string | null, hasAttachments = false) => {
    // "First build" can NOT be hasGeneratedFiles alone: new projects ship with
    // starter placeholder files, so hydration flips it true before the user's
    // first real build and staging would silently never trigger (found in
    // authed E2E Jul 18). A project is fresh until its entry file stops being
    // the starter placeholder.
    const st = useEditorStore.getState();
    const appFile = (st.files?.['src/App.tsx'] || st.files?.['App.tsx'] || st.files?.['src/App.jsx']) as { content?: string } | undefined;
    const isFirstBuild = !st.hasGeneratedFiles || isPlaceholderApp(appFile?.content);
    if (AGENT_TEAM_ENABLED && !img && !hasAttachments && isFirstBuild) {
      await runAgenticBuild(content, img, paletteId);
      return;
    }
    await executeGeneration(content, img, paletteId ? { paletteId } : undefined);
  }, [executeGeneration, runAgenticBuild]);

  const handleUndo = useCallback(() => {
    if (checkpoints.length === 0) return;
    const last = checkpoints[checkpoints.length - 1];
    restoreCheckpoint(last.id);
    const updated = last.files;
    saveProject(updated as any);
    addMessage({ id: uid(), role:'assistant', content: t('revertedToMsg').replace('{label}', last.label), timestamp:Date.now(), status:'done' });
  }, [checkpoints, restoreCheckpoint, saveProject, addMessage]);

  /**
   * Save one or more inline secrets to the vault, then proceed to generation.
   * Called from the dep-gate UI's "Save & Build" button.
   */
  const saveSecretsAndBuild = useCallback(async () => {
    if (!pendingGenArgs) return;
    setSecretSaving(true);
    try {
      for (const [name, value] of Object.entries(inlineSecrets)) {
        if (!value.trim()) continue;
        await fetch('/api/secrets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, value: value.trim() }),
        });
      }
    } catch { /* non-fatal — proceed anyway */ }
    const { prompt, img } = pendingGenArgs;
    setInlineSecrets({});
    setSecretSaving(false);
    setPendingGenArgs(null);
    await startGeneration(prompt, img);
    // Tell the Connectors panel to refresh only after the triggered build
    // finishes — firing this right after the vault save made the panel show
    // "✓ Connected" while "Applying changes..." was still spinning, which
    // read as a stuck/contradictory state even though both were accurate.
    window.dispatchEvent(new CustomEvent('wyber:secrets-saved'));
  }, [pendingGenArgs, inlineSecrets, startGeneration]);

  /**
   * Conversational lane: questions, confirmations, greetings. Hits /api/assist,
   * which deducts no credits and parses no files. If `forceChat` is false the
   * server may decide the message is actually a build/edit — in that case it
   * returns X-Assist-Intent: action and we route to executeGeneration instead.
   */
  const handleConversational = useCallback(async (userMsg: string, img: AttachedImage | null, forceChat: boolean, opts?: { echoedUser?: boolean }) => {
    const hasFiles = Object.keys(files ?? {}).length > 0;
    // Echo the user's message immediately (always correct to show their own text) —
    // unless the caller already did (a retry re-sending a message already on screen).
    if (!opts?.echoedUser) {
      const userMsgId = uid();
      addMessage({ id: userMsgId, role: 'user', content: userMsg, timestamp: Date.now(), status: 'done' });
      persistMessage('user', userMsg, undefined, userMsgId);
    }

    // The WHOLE project, not a selection. The AI wrote these files — it must
    // never have to ask the user to find or paste one (most users never even
    // open the code view). Generated apps almost always fit a modern context
    // window whole; files are sent full (most relevant first) until the char
    // budget is spent, and anything past it ships as a signature outline so
    // the model still KNOWS the file and its API rather than being blind to it.
    const allPaths = Object.keys(files ?? {});
    const manifest = allPaths.length
      ? `EXISTING FILES:\n${allPaths.map(p => `- ${p}`).join('\n')}`
      : '';
    const CHAT_CORE = ['app.tsx', 'app.vue', 'index.html', 'index.css', 'app.css', 'main.tsx'];
    const chatPromptLower = userMsg.toLowerCase();
    const chatScored = Object.entries(files ?? {})
      .map(([path, f]) => {
        const pathLower = path.toLowerCase();
        let score = CHAT_CORE.some(c => pathLower.endsWith(c)) ? 100 : 0;
        chatPromptLower.split(/\s+/).filter(w => w.length > 3).forEach(w => { if (pathLower.includes(w)) score += 20; });
        return { path, content: ((f as any).content ?? '') as string, score };
      })
      .sort((a, b) => b.score - a.score);
    const CHAT_CONTEXT_BUDGET = 200_000; // chars ≈ 50k tokens — cached after turn 1
    let chatBudgetUsed = 0;
    const chatFullFiles: string[] = [];
    const chatOutlines: string[] = [];
    for (const { path, content } of chatScored) {
      const body = content.length > 12000 ? content.slice(0, 12000) + '\n/* ...truncated... */' : content;
      if (chatBudgetUsed + body.length <= CHAT_CONTEXT_BUDGET) {
        chatFullFiles.push(`<file path="${path}">\n${body}\n</file>`);
        chatBudgetUsed += body.length;
      } else {
        chatOutlines.push(`<outline path="${path}">\n${extractSignatures(content)}\n</outline>`);
      }
    }
    const chatFileContext = manifest
      + (chatFullFiles.length ? '\n\n' + chatFullFiles.join('\n\n') : '')
      + (chatOutlines.length ? '\n\nFILE OUTLINES (content omitted for size — exported signatures only):\n' + chatOutlines.join('\n') : '');
    const history = messages.filter(m => m.status === 'done').slice(-10).map(m => ({ role: m.role, content: m.content }));

    setChatThinking(true);
    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, fileContext: chatFileContext, history, hasFiles, forceChat, projectId: resolvedProjectId }),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('SESSION_EXPIRED');
        throw new Error(await res.text());
      }

      // The server reclassified this as a real build/edit → hand to the build
      // lane. Two paths land here: the pre-reply Haiku classification (empty
      // body) and the reply model's own <<BUILD>> handoff, whose body is a
      // restatement of the work (e.g. the full list of issues it proposed) —
      // a far better build prompt than a bare "fix all 6 now".
      if (res.headers.get('X-Assist-Intent') === 'action') {
        setChatThinking(false);
        const handoff = (await res.text()).trim();
        await executeGeneration(handoff || userMsg, img, { echoedUser: true });
        return;
      }

      // Stream the conversational reply into a fresh assistant bubble.
      const assistantId = uid();
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let created = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        if (!created && full.trim()) {
          setChatThinking(false);
          addMessage({ id: assistantId, role: 'assistant', content: full, timestamp: Date.now(), status: 'done' });
          created = true;
        } else if (created) {
          updateMessage(assistantId, { content: full });
        }
      }
      // Safety net: if a <<BUILD>> handoff slipped past the server's detection
      // window (marker buried deeper than its scan), never render or persist
      // raw protocol text — keep only the prose before the marker.
      if (created && full.includes('<<BUILD>>')) {
        full = full.slice(0, full.indexOf('<<BUILD>>')).trim()
          || t('buildHandoffFallbackMsg');
        updateMessage(assistantId, { content: full });
      }
      if (!created) {
        // Empty reply — degrade gracefully, still no charge.
        setChatThinking(false);
        addMessage({ id: assistantId, role: 'assistant', content: t('rephraseMsg'), timestamp: Date.now(), status: 'done' });
        full = t('rephraseMsg');
      }
      persistMessage('assistant', full);
    } catch (err) {
      setChatThinking(false);
      const isSessionExpired = err instanceof Error && err.message === 'SESSION_EXPIRED';
      const errMsg = isSessionExpired
        ? t('sessionExpiredChatMsg')
        : `${t('errorPrefix')} ${err instanceof Error ? err.message : t('couldNotReachAssistantLabel')}`;
      addMessage({ id: uid(), role: 'assistant', content: errMsg, timestamp: Date.now(), status: 'error', retryPrompt: userMsg, retryLane: 'chat' });
    } finally {
      setChatThinking(false);
    }
  }, [files, messages, addMessage, updateMessage, persistMessage, executeGeneration]);

  // The intent-routing tail shared by a normal send, a Retry, and edit-and-
  // regenerate: classify (CHAT/AMBIGUOUS → conversational lane, EDIT/BUILD →
  // generation) and dispatch. Pulled out of handleSend so those other entry
  // points don't have to re-run handleSend's input-box-specific gates above
  // this point (plan mode, regulated-domain notice, pre-gen dep gate) — those
  // only make sense for a message freshly typed into the box.
  const dispatchTurn = useCallback(async (content: string, img: AttachedImage | null, hasAttachments = false, paletteId?: string | null) => {
    const isNewBuild = Object.keys(files ?? {}).length === 0;
    if (!img && !hasAttachments) {
      const intent = classifyIntent(content, !isNewBuild);
      if (intent === 'CHAT' || intent === 'AMBIGUOUS') {
        await handleConversational(content, img, intent === 'CHAT');
        return;
      }
    }
    await startGeneration(content, img, paletteId, hasAttachments);
  }, [files, handleConversational, startGeneration]);

  // Everything that runs once the user has settled on "just build it" —
  // regulated-domain notice, pre-gen dep gate, then the intent router. Pulled
  // out of handleSend so the plan-offer gate's "Just build it" button can run
  // the exact same path without duplicating it a third time (pendingRegulated
  // already duplicates it once, for its own "continue" button).
  const proceedPastPlanOffer = useCallback(async (userMsg: string, img: AttachedImage | null, hasAttachments: boolean, paletteId?: string | null) => {
    // ── Regulated-domain notice (non-blocking) ──────────────────────────
    // Only on new builds; skip if user already acknowledged this prompt.
    const isNewBuild = Object.keys(files ?? {}).length === 0;
    if (isNewBuild && !img) {
      const regulated = detectRegulated(userMsg)
      if (regulated.length > 0) {
        setPendingRegulated({ prompt: userMsg, img, domains: regulated })
        return
      }
    }

    // ── Pre-gen dep gate ────────────────────────────────────────────────
    // Only for new builds (no existing files), and only when there's no
    // image attached (image = screenshot-to-app, never needs a dep gate).
    if (isNewBuild && !img) {
      const deps = detectDeps(userMsg);
      if (deps.hasAnyDep) {
        // Check which keys the user already has stored
        let existingNames: string[] = [];
        try {
          const r = await fetch('/api/secrets');
          if (r.ok) {
            const data = await r.json();
            existingNames = (data.secrets ?? []).map((s: { name: string }) => s.name.toUpperCase());
          }
        } catch { /* can't fetch secrets — show gate anyway */ }

        const missingSupabase = deps.needsSupabase &&
          !existingNames.some(n => n.includes('SUPABASE'))
        const missingStripe = deps.needsStripe &&
          !existingNames.some(n => n.includes('STRIPE'))
        const missingComposio = deps.composioTools.filter(t =>
          !existingNames.some(n => n.toUpperCase().includes(t.toUpperCase()))
        );

        const hasMissing = missingSupabase || missingStripe || missingComposio.length > 0;
        if (hasMissing) {
          // Show the gate — do NOT start generation yet
          setPendingGenArgs({ prompt: userMsg, img, needsSupabase: missingSupabase, needsStripe: missingStripe, composioTools: missingComposio });
          // Pre-fill secret key names so the UI has fields ready
          const initialSecrets: Record<string, string> = {};
          if (missingSupabase) { initialSecrets['SUPABASE_URL'] = ''; initialSecrets['SUPABASE_ANON_KEY'] = ''; }
          if (missingStripe)   { initialSecrets['STRIPE_PUBLISHABLE_KEY'] = ''; }
          for (const t of missingComposio) initialSecrets[`${t.toUpperCase()}_API_KEY`] = '';
          setInlineSecrets(initialSecrets);
          return; // do NOT call executeGeneration here
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────

    // ── Intent router ───────────────────────────────────────────────────
    // Images always build (screenshot-to-app). Otherwise classify: CHAT and
    // AMBIGUOUS go to the conversational lane (no credits, no build loader);
    // EDIT/BUILD go straight to generation.
    await dispatchTurn(userMsg, img, hasAttachments, paletteId);
  }, [files, dispatchTurn]);

  const handleSend = useCallback(async () => {
    // No credits<=0 gate here — conversational messages are FREE, so the box
    // stays usable at 0 credits. The build/edit path is blocked separately in
    // executeGeneration with a clear "out of credits" message.
    if ((!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating || imageReading) return;
    const userMsg = input.trim();
    const img = attachedImage;
    const hasAttachments = attachedFiles.length > 0;
    setInput('');
    setAttachedImage(null);
    if (planMode) {
      setPendingPlan({ prompt: userMsg, image: img });
      return;
    }

    // ── First-build advisory offer ───────────────────────────────────────
    // Ask once, on a genuinely new project's first message, whether the user
    // wants to see a build plan/roadmap first — most people never discover
    // the manual "◎ Plan" toggle above the input box on their own. Gated on
    // `isFirstBuild` (!hasGeneratedFiles), NOT an empty-files check — every
    // brand-new project gets an auto-seeded starter-template scaffold on
    // mount (see the hydration effect above) so `files` is never actually
    // empty by the time the user can type anything.
    if (isFirstBuild && !img && !planOfferShownRef.current) {
      planOfferShownRef.current = true;
      setPendingPlanOffer({ prompt: userMsg, img, hasAttachments });
      return;
    }

    await proceedPastPlanOffer(userMsg, img, hasAttachments);
  }, [input, attachedImage, attachedFiles, isGenerating, planMode, isFirstBuild, proceedPastPlanOffer]);

  // Halts an in-flight generation via the ref-lifted AbortController (see
  // executeGeneration). userStoppedRef distinguishes this from the 320s
  // auto-timeout hitting the same controller, so the resulting message is honest
  // about which happened.
  const handleStop = useCallback(() => {
    userStoppedRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  const handleCopyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(copyableMessageText(content)).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(prev => (prev === id ? null : prev)), 1500);
    });
  }, []);

  // Re-sends whatever the failed turn originally sent, through whichever lane
  // it originally used (retryPrompt/retryLane, set at the point of failure) —
  // not a fresh classification, since re-classifying could pick a different
  // lane than what actually failed.
  const handleRetry = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.retryPrompt) return;
    setMessages(messages.filter(m => m.id !== messageId));
    if (msg.retryLane === 'chat') {
      await handleConversational(msg.retryPrompt, null, true, { echoedUser: true });
    } else {
      await executeGeneration(msg.retryPrompt, null, { echoedUser: true });
    }
  }, [messages, setMessages, handleConversational, executeGeneration]);

  const handleStartEdit = useCallback((msg: { id: string; content: string }) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, []);

  // v1 scope: linear edit, not branching — everything from the edited message
  // onward is discarded (both client state and the DB rows, via the PATCH
  // below) and the edited content is resent through the normal dispatch path,
  // which re-classifies and re-persists it fresh. Matches how a user retyping
  // the message from scratch would behave.
  const handleSaveEdit = useCallback(async () => {
    const messageId = editingMessageId;
    const newContent = editingText.trim();
    if (!messageId || !newContent || isGenerating) return;
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    setEditingMessageId(null);
    setEditingText('');
    setMessages(messages.slice(0, idx));
    if (resolvedProjectId) {
      try {
        await fetch('/api/projects/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, messageId }),
        });
      } catch { /* best-effort — the in-memory truncation above already reflects the edit */ }
    }
    await dispatchTurn(newContent, null, false);
  }, [editingMessageId, editingText, isGenerating, messages, setMessages, resolvedProjectId, dispatchTurn]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-surface)', position:'relative' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{ padding:'0 12px', height:40, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--ide-border)', background:'var(--bg-base)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--ide-green)', boxShadow:'0 0 6px rgba(34,197,94,0.5)' }} />
          <span style={{ fontSize:12, fontWeight:600, color:'var(--ide-text)', letterSpacing:'-0.02em' }}>WyberAi</span>
          {lastModel && lastCreditCost && (
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'var(--bg-overlay)', color:'var(--ide-text3)', border:'1px solid var(--ide-border)' }}>
              {lastCreditCost}cr
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {checkpoints.length > 0 && !isGenerating && (
            <button
              onClick={handleUndo}
              title={t('undoTooltip')}
              style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600, letterSpacing:'-0.01em', transition:'var(--t)' }}
            >
              {t('undoButton')}
            </button>
          )}
          <button
            onClick={() => setPlanMode(v => !v)}
            title={t('planModeTooltip')}
            style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:`1px solid ${planMode ? 'var(--accent-dim)' : 'var(--ide-border)'}`, background: planMode ? 'var(--accent-glow)' : 'transparent', color: planMode ? 'var(--accent)' : 'var(--ide-text3)', cursor:'pointer', fontWeight:600, letterSpacing:'-0.01em', transition:'var(--t)' }}
          >
            {t('planModeButton')}
          </button>
        </div>
      </div>

      {/* Storage banner moved to PreviewPanel as platform chrome */}

      {/* Plan mode pending */}
      {pendingPlan && (
        <div style={{ flexShrink:0, borderBottom:'1px solid var(--border)', overflow:'auto', maxHeight:400 }}>
          <PlanMode
            prompt={pendingPlan.prompt}
            framework={framework}
            fileContext={Object.entries(files).slice(0,10).map(([p,f]) => `<file path="${p}">\n${(f as any).content.slice(0,1500)}\n</file>`).join('\n\n')}
            projectId={projectId}
            onApprove={(planSpec, paletteId) => {
              const { image, prompt: originalPrompt } = pendingPlan;
              setPendingPlan(null);
              // The model gets the full plan spec (title/approach/steps/Q&A);
              // the chat bubble shows the user's own original words instead —
              // a giant technical spec dumped into the thread would look
              // nothing like a normal message.
              executeGeneration(planSpec, image, { displayContent: originalPrompt, paletteId });
            }}
            onCancel={() => setPendingPlan(null)}
          />
        </div>
      )}

      {/* ── First-build advisory offer ────────────────────────────────── */}
      {pendingPlanOffer && (
        <div style={{ flexShrink:0, borderBottom:'1px solid var(--ide-border)', background:'var(--bg-base)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ide-text)', letterSpacing:'-0.01em' }}>{t('planOfferTitle')}</div>
              <div style={{ fontSize:11, color:'var(--ide-text3)', marginTop:1 }}>
                {t('planOfferDesc')}
              </div>
            </div>
          </div>
          {/* Free design-direction pick — applies to both buttons' builds */}
          <DirectionCards prompt={pendingPlanOffer.prompt} selectedId={offerPaletteId} onPick={setOfferPaletteId} />
          <div style={{ display:'flex', gap:7 }}>
            <button
              onClick={() => {
                const { prompt, img } = pendingPlanOffer;
                setPendingPlanOffer(null);
                setPendingPlan({ prompt, image: img });
              }}
              style={{ flex:1, padding:'7px 0', borderRadius:7, border:'none', background:'var(--accent)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}
            >
              {t('showPlanButton').replace('{credits}', String(creditCost('plan', 'default')))}
            </button>
            <button
              onClick={async () => {
                const { prompt, img, hasAttachments } = pendingPlanOffer;
                const picked = offerPaletteId;
                setPendingPlanOffer(null);
                setOfferPaletteId(null);
                await proceedPastPlanOffer(prompt, img, hasAttachments, picked);
              }}
              style={{ padding:'7px 14px', borderRadius:7, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              {t('justBuildItButton')}
            </button>
          </div>
        </div>
      )}

      {/* ── Regulated-domain compliance notice ─────────────────────── */}
      {pendingRegulated && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--ide-border)', background: '#0f0a00', padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: '-0.01em', marginBottom: 3 }}>
                {t('regulatedTitle')}
              </div>
              <div style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.6 }}>
                {t('regulatedIntroPrefix')}{' '}
                <strong style={{ color: '#fef3c7' }}>
                  {pendingRegulated.domains.map(d => d.label).join(' and ')}
                </strong>
                {' '}{t('regulatedIntroSuffix')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 29 }}>
            {pendingRegulated.domains.map(d => (
              <div key={d.label} style={{ fontSize: 11, color: '#fef3c7', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 6, padding: '5px 9px', lineHeight: 1.5 }}>
                <strong>{d.label}:</strong> {d.requirement}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.6, paddingLeft: 29 }}>
            {t('regulatedFooterNotice')}
          </div>

          <div style={{ display: 'flex', gap: 7, paddingLeft: 29 }}>
            <button
              onClick={async () => {
                const { prompt, img } = pendingRegulated
                setPendingRegulated(null)
                // Re-run the full handleSend path but skip regulated check by injecting directly
                setInput('')
                setAttachedImage(null)
                const isNew = Object.keys(files ?? {}).length === 0
                if (isNew && !img) {
                  const deps = detectDeps(prompt)
                  if (deps.hasAnyDep) {
                    let existingNames: string[] = []
                    try {
                      const r = await fetch('/api/secrets')
                      if (r.ok) { const data = await r.json(); existingNames = (data.secrets ?? []).map((s: { name: string }) => s.name.toUpperCase()) }
                    } catch { /* proceed anyway */ }
                    const missingSupabase = deps.needsSupabase && !existingNames.some(n => n.includes('SUPABASE'))
                    const missingStripe   = deps.needsStripe   && !existingNames.some(n => n.includes('STRIPE'))
                    const missingComposio = deps.composioTools.filter(t => !existingNames.some(n => n.toUpperCase().includes(t.toUpperCase())))
                    if (missingSupabase || missingStripe || missingComposio.length > 0) {
                      const initialSecrets: Record<string, string> = {}
                      if (missingSupabase) { initialSecrets['SUPABASE_URL'] = ''; initialSecrets['SUPABASE_ANON_KEY'] = '' }
                      if (missingStripe)   { initialSecrets['STRIPE_PUBLISHABLE_KEY'] = '' }
                      for (const t of missingComposio) initialSecrets[`${t.toUpperCase()}_API_KEY`] = ''
                      setInlineSecrets(initialSecrets)
                      setPendingGenArgs({ prompt, img, needsSupabase: missingSupabase, needsStripe: missingStripe, composioTools: missingComposio })
                      return
                    }
                  }
                }
                await executeGeneration(prompt, img)
              }}
              style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {t('regulatedProceedButton')}
            </button>
            <button
              onClick={() => { setPendingRegulated(null); setInput(pendingRegulated.prompt) }}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {tc('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Dep-gate panel ─────────────────────────────────────────── */}
      {pendingGenArgs && (
        <div style={{ flexShrink:0, borderBottom:'1px solid var(--ide-border)', background:'var(--bg-base)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ide-text)', letterSpacing:'-0.01em' }}>{t('depGateTitle')}</div>
              <div style={{ fontSize:11, color:'var(--ide-text3)', marginTop:1 }}>
                {t('depGateDesc')}
              </div>
            </div>
          </div>

          {/* Supabase section */}
          {pendingGenArgs.needsSupabase && (
            <div style={{ background:'rgba(63,207,142,0.06)', border:'1px solid rgba(63,207,142,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>🗄</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#3FCF8E' }}>Supabase</span>
                <span style={{ fontSize:11, color:'var(--ide-text3)' }}>{t('supabaseSectionDesc')}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {['SUPABASE_URL', 'SUPABASE_ANON_KEY'].map(key => (
                  <input key={key}
                    placeholder={key === 'SUPABASE_URL' ? 'https://xxxx.supabase.co' : 'eyJhbGci...'}
                    value={inlineSecrets[key] ?? ''}
                    onChange={e => setInlineSecrets(s => ({ ...s, [key]: e.target.value }))}
                    style={{ width:'100%', padding:'6px 9px', borderRadius:6, border:'1px solid rgba(63,207,142,0.2)', background:'var(--bg-elevated)', color:'var(--ide-text)', fontSize:11, fontFamily:'monospace', outline:'none' }}
                  />
                ))}
                <div style={{ fontSize:10, color:'var(--ide-text3)' }}>
                  {t('supabaseFindKeysNote')}
                </div>
              </div>
            </div>
          )}

          {/* Stripe section */}
          {pendingGenArgs.needsStripe && (
            <div style={{ background:'rgba(99,91,255,0.06)', border:'1px solid rgba(99,91,255,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>💳</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#635BFF' }}>Stripe</span>
                <span style={{ fontSize:11, color:'var(--ide-text3)' }}>{t('stripeSectionDesc')}</span>
              </div>
              <input
                placeholder="pk_live_... or pk_test_..."
                value={inlineSecrets['STRIPE_PUBLISHABLE_KEY'] ?? ''}
                onChange={e => setInlineSecrets(s => ({ ...s, 'STRIPE_PUBLISHABLE_KEY': e.target.value }))}
                style={{ width:'100%', padding:'6px 9px', borderRadius:6, border:'1px solid rgba(99,91,255,0.2)', background:'var(--bg-elevated)', color:'var(--ide-text)', fontSize:11, fontFamily:'monospace', outline:'none' }}
              />
              <div style={{ fontSize:10, color:'var(--ide-text3)', marginTop:5 }}>
                {t('stripeFindKeysNote')}
              </div>
            </div>
          )}

          {/* Generic connector (from the Connectors panel) */}
          {pendingGenArgs.customGroup && (
            <div style={{ background:`${pendingGenArgs.customGroup.color}0f`, border:`1px solid ${pendingGenArgs.customGroup.color}33`, borderRadius:8, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>{pendingGenArgs.customGroup.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:pendingGenArgs.customGroup.color }}>{pendingGenArgs.customGroup.label}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {pendingGenArgs.customGroup.keys.map(k => (
                  <input key={k.name}
                    placeholder={k.placeholder}
                    value={inlineSecrets[k.name] ?? ''}
                    onChange={e => setInlineSecrets(s => ({ ...s, [k.name]: e.target.value }))}
                    style={{ width:'100%', padding:'6px 9px', borderRadius:6, border:`1px solid ${pendingGenArgs.customGroup!.color}33`, background:'var(--bg-elevated)', color:'var(--ide-text)', fontSize:11, fontFamily:'monospace', outline:'none' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Composio tools */}
          {pendingGenArgs.composioTools.length > 0 && (
            <div style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--blue)', marginBottom:6 }}>
                {t('composioToolsNeeded').replace('{tools}', pendingGenArgs.composioTools.join(', '))}
              </div>
              <div style={{ fontSize:11, color:'var(--ide-text3)' }}>
                {t('composioConnectNote')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:7 }}>
            <button
              onClick={saveSecretsAndBuild}
              disabled={secretSaving}
              style={{ flex:1, padding:'7px 0', borderRadius:7, border:'none', background:'var(--accent)', color:'white', fontSize:12, fontWeight:700, cursor:'pointer', opacity: secretSaving ? 0.7 : 1 }}
            >
              {secretSaving ? tc('saving') : t('saveKeysAndBuildButton')}
            </button>
            <button
              onClick={() => {
                const { prompt, img } = pendingGenArgs;
                setPendingGenArgs(null);
                setInlineSecrets({});
                startGeneration(prompt, img);
              }}
              style={{ padding:'7px 14px', borderRadius:7, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              {t('buildWithoutBackendButton')}
            </button>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────── */}

      {dragOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(124,110,247,0.1)', border:'2px dashed var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, pointerEvents:'none' }}>
          <span style={{ fontSize:14, color:'var(--accent)', fontWeight:500 }}>{t('dropFilesBanner')}</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflow:'auto', padding:'8px 0', scrollbarWidth:'thin' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ padding:'4px 12px', marginBottom:1 }}>
            {msg.role === 'user' ? (
              editingMessageId === msg.id ? (
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <div style={{ width:'85%', display:'flex', flexDirection:'column', gap:5 }}>
                    <textarea
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') handleCancelEdit(); }}
                      autoFocus
                      rows={Math.min(8, Math.max(2, editingText.split('\n').length))}
                      style={{ width:'100%', padding:'9px 13px', borderRadius:10, border:'1px solid var(--accent)', background:'var(--bg-elevated)', color:'var(--ide-text)', fontSize:12, lineHeight:1.55, fontFamily:'inherit', resize:'vertical', outline:'none' }}
                    />
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button onClick={handleCancelEdit} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600 }}>{tc('cancel')}</button>
                      <button onClick={handleSaveEdit} disabled={!editingText.trim()} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'var(--accent)', color:'#fff', cursor: editingText.trim() ? 'pointer' : 'not-allowed', fontWeight:600, opacity: editingText.trim() ? 1 : 0.5 }}>{t('saveRegenerateButton')}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'flex-end', gap:5 }}>
                  {!isGenerating && !msg.content.startsWith('[Image:') && (
                    <button
                      onClick={() => handleStartEdit(msg)}
                      title={t('editRegenerateTooltip')}
                      style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', padding:3, borderRadius:5, display:'flex', flexShrink:0 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                  )}
                  <div style={{ background:'var(--accent)', borderRadius:'12px 12px 3px 12px', padding:'9px 13px', fontSize:13, lineHeight:1.55, color:'#fff', maxWidth:'85%', letterSpacing:'-0.01em' }}>
                    {msg.content.startsWith('[Image:') ? (
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{opacity:0.8}}><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="5.5" cy="5.5" r="1.5"/><path d="M1 11l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {msg.content.split('\n')[0].replace('[Image: ','').replace(']','')}
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              )
            ) : (
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, lineHeight:1.65, color: msg.status === 'error' ? 'var(--ide-red)' : 'var(--ide-text2)', letterSpacing:'-0.01em' }}>
                    {msg.status === 'streaming'
                      ? <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {liveReasoning && (
                            <div style={{ fontSize:10.5, fontStyle:'italic', color:'var(--ide-text3)', maxHeight:54, overflow:'hidden', maskImage:'linear-gradient(to bottom, black 60%, transparent)', WebkitMaskImage:'linear-gradient(to bottom, black 60%, transparent)' }}>
                              🧠 {liveReasoning.slice(-260)}
                            </div>
                          )}
                          {AGENT_TEAM_ENABLED && agentEvents.length > 0
                            ? <AgentFeedBoundary>
                                <AgentTeamFeed elapsed={elapsed} progressSteps={progressSteps} />
                              </AgentFeedBoundary>
                            : progressSteps.length > 0
                            ? <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                {progressSteps.map((step, i) => {
                                  const isLast = i === progressSteps.length - 1;
                                  return (
                                    <span key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color: isLast ? 'var(--ide-text2)' : 'var(--ide-text3)' }}>
                                      {isLast
                                        ? <span style={{ width:9, height:9, borderRadius:'50%', border:'1.5px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block', flexShrink:0 }}/>
                                        : <span style={{ width:9, height:9, borderRadius:'50%', background:'var(--ide-green)', display:'inline-block', flexShrink:0 }}/>
                                      }
                                      {step}
                                    </span>
                                  );
                                })}
                                <span style={{ fontSize:10, color:'var(--ide-text3)', marginTop:1 }}>{elapsed > 0 && `${elapsed}s`}</span>
                              </div>
                            : <span style={{ display:'flex', alignItems:'center', gap:7, color:'var(--ide-text3)', fontSize:11 }}>
                                <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                                <span className="ide-shimmer-text">{buildMsg}</span> {elapsed > 0 && `(${elapsed}s)`}
                              </span>
                          }
                        </div>
                      : <>
                          {msg.reasoning && (
                            <div style={{ marginBottom:6 }}>
                              <button
                                onClick={() => setExpandedReasoning(prev => {
                                  const next = new Set(prev);
                                  if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                                  return next;
                                })}
                                style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, color:'var(--ide-text3)', background:'transparent', border:'none', cursor:'pointer', padding:0 }}
                              >
                                🧠 {expandedReasoning.has(msg.id) ? t('hideReasoningLabel') : t('showReasoningLabel')}
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: expandedReasoning.has(msg.id) ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
                              </button>
                              {expandedReasoning.has(msg.id) && (
                                <div style={{ marginTop:5, padding:'8px 10px', borderRadius:8, border:'1px solid var(--ide-border)', background:'var(--bg-elevated)', fontSize:11, fontStyle:'italic', lineHeight:1.6, color:'var(--ide-text3)', whiteSpace:'pre-wrap' }}>
                                  {msg.reasoning}
                                </div>
                              )}
                            </div>
                          )}
                          {(() => {
                            // Build receipts (messages that changed files) collapse
                            // to their first line; prose answers render in full.
                            if (!msg.filesChanged?.length) return <MessageBody content={msg.content} />;
                            const { lead, rest } = splitReceipt(msg.content);
                            if (!rest) return <MessageBody content={msg.content} />;
                            const detailsOpen = expandedDetails.has(msg.id);
                            return (
                              <>
                                <MessageBody content={lead} />
                                <button
                                  onClick={() => setExpandedDetails(prev => {
                                    const next = new Set(prev);
                                    if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                                    return next;
                                  })}
                                  style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, color:'var(--ide-text3)', background:'transparent', border:'none', cursor:'pointer', padding:0, marginTop:4 }}
                                >
                                  {detailsOpen ? t('hideDetailsLabel') : t('showDetailsLabel')}
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
                                </button>
                                {detailsOpen && (
                                  <div style={{ marginTop:5 }}>
                                    <MessageBody content={rest} />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                    }
                  </div>
                  {msg.filesChanged && msg.filesChanged.length > 0 && (
                    <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:3 }}>
                      {msg.filesChanged.map(f => (
                        <span key={f} style={{ background:'var(--accent-glow)', color:'var(--accent)', padding:'1px 6px', borderRadius:4, fontSize:10, border:'1px solid var(--accent-dim)', fontFamily:'monospace' }}>✎ {f}</span>
                      ))}
                    </div>
                  )}
                  {msg.agentReport && (
                    <AgentFeedBoundary>
                      {msg.agentReport.agents.some(a => a.id === 'security') && (
                        <SecurityReportCard report={msg.agentReport} />
                      )}
                      <TurnReceipt report={msg.agentReport} />
                    </AgentFeedBoundary>
                  )}
                  {msg.status === 'done' && msg.id === lastBuildMsgId && userPlan === 'free' && !buildNudgeDismissed && (
                    <div style={{ marginTop:10, padding:'12px 14px', borderRadius:10, border:'1px solid rgba(14,165,233,0.18)', background:'linear-gradient(135deg,rgba(14,165,233,0.06),rgba(14,165,233,0.02))' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'#38bdf8', marginBottom:4 }}>Build more, faster.</div>
                          <div style={{ fontSize:12, color:'var(--ide-text2)', lineHeight:1.5 }}>
                            You're on free — {credits} credit{credits === 1 ? '' : 's'} left. Go annual from {creditsCurrency === 'INR' ? '₹399/mo' : '$23/mo'} and <span style={{ color:'#22c55e', fontWeight:700 }}>save 20%</span> — 150 credits/mo.
                          </div>
                        </div>
                        <button onClick={() => setBuildNudgeDismissed(true)} style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:2, flexShrink:0 }}>×</button>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        <button
                          onClick={() => { track('editor_post_build_nudge_upgrade_clicked', { billing: 'annual' }); setUpgradeTrigger('nudge'); setUpgradeModalOpen(true); }}
                          style={{ fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#0ea5e9,#7c3aed)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}
                        >Upgrade — Save 20%</button>
                        <button
                          onClick={() => setBuildNudgeDismissed(true)}
                          style={{ fontSize:12, padding:'6px 14px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontFamily:'inherit' }}
                        >Maybe later</button>
                      </div>
                    </div>
                  )}
                  {(msg.status === 'done' || msg.status === 'error') && (
                    <div style={{ marginTop:5, display:'flex', gap:4 }}>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title={t('copyMessageTooltip')}
                        style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color: copiedMessageId === msg.id ? 'var(--ide-green)' : 'var(--ide-text3)', cursor:'pointer', fontWeight:600 }}
                      >
                        {copiedMessageId === msg.id ? '✓ ' + tc('copied') : tc('copy')}
                      </button>
                      {msg.status === 'error' && msg.retryPrompt && !isGenerating && (
                        <button
                          onClick={() => handleRetry(msg.id)}
                          title={t('retryMessageTooltip')}
                          style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/></svg>
                          {tc('retry')}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Highest-intent upsell moment: they just tried to build and
                      got blocked by credits. A plain error bubble was a dead
                      end here — this is the one place a free user is guaranteed
                      to see, mid-session, right after wanting to do more. */}
                  {msg.status === 'error' && msg.content.includes('Not enough credits') && (
                    <button
                      onClick={() => { track('editor_out_of_credits_upgrade_clicked'); setUpgradeTrigger('out-of-credits'); setUpgradeModalOpen(true); }}
                      style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'7px 13px', borderRadius:8, border:'1px solid rgba(14,165,233,0.35)', background:'linear-gradient(135deg, rgba(14,165,233,0.16), rgba(14,165,233,0.06))', color:'#38bdf8', cursor:'pointer', fontFamily:'inherit' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z"/></svg>
                      {creditsCurrency === 'INR' ? 'Upgrade — from ₹399/mo annual (save 20%)' : 'Upgrade — from $23/mo annual (save 20%)'}
                    </button>
                  )}
                  {msg.designSuggestion && !dismissedSuggestions.has(msg.id) && (
                    <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                      <button
                        onClick={() => { setInput(msg.designSuggestion!.prompt); textareaRef.current?.focus(); }}
                        title={t('fillFollowUpTooltip')}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ide-text)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ide-text2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; }}
                      >
                        {msg.designSuggestion.label}
                      </button>
                      <button
                        onClick={() => setDismissedSuggestions(prev => new Set(prev).add(msg.id))}
                        title={t('dismissTooltip')}
                        style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {msg.loopStop && (
                    <AgentFeedBoundary>
                      <LoopStopCard
                        loopStop={msg.loopStop}
                        onRetry={(p) => { setInput(p); textareaRef.current?.focus(); }}
                        onDismiss={() => updateMessage(msg.id, { loopStop: undefined })}
                      />
                    </AgentFeedBoundary>
                  )}
                  {msg.fixOffer && (
                    <AgentFeedBoundary>
                      <FixOfferCard
                        fixOffer={msg.fixOffer}
                        onFix={() => {
                          const offer = msg.fixOffer!
                          updateMessage(msg.id, { fixOffer: undefined })
                          window.dispatchEvent(new CustomEvent('wyber-autofix', {
                            detail: { prompt: offer.prompt, error: offer.error, approved: true },
                          }))
                        }}
                        onDismiss={() => updateMessage(msg.id, { fixOffer: undefined })}
                      />
                    </AgentFeedBoundary>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Fallback build indicator — ONLY when no streaming bubble exists yet
            (before the first token arrives). A streaming assistant message
            renders this same ticker inside its own bubble, so showing both
            duplicated the "Setting up the design system... (15s)" row. ONE
            canonical progress surface, always. */}
        {isGenerating && progressSteps.length === 0 && !messages.some(m => m.status === 'streaming') && (
          <div style={{ padding:'4px 12px' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:5, fontSize:12, color:'var(--ide-text3)' }}>
                <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                <span className="ide-shimmer-text">{buildMsg}</span> {elapsed > 0 && `(${elapsed}s)`}
              </div>
            </div>
          </div>
        )}

        {chatThinking && (
          <div style={{ padding:'4px 12px' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:5, fontSize:12, color:'var(--ide-text3)' }}>
                <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                <span className="ide-shimmer-text">{t('thinkingLabel')}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div style={{ margin:'0 12px', display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
          {attachedFiles.map(f => (
            <div key={f.localId} style={{ padding:'6px 8px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--accent-dim)', display:'flex', alignItems:'center', gap:8, maxWidth:220 }}>
              {f.kind === 'image' && attachedImage?.name === f.name
                ? <img src={attachedImage.dataUrl} alt="" style={{ width:32, height:32, objectFit:'cover', borderRadius:5, flexShrink:0 }} />
                : <span style={{ fontSize:18, flexShrink:0 }}>{f.kind === 'image' ? '🖼' : f.kind === 'pdf' ? '📕' : f.kind === 'text' && /\.xlsx?$/i.test(f.name) ? '📊' : f.kind === 'text' ? '📄' : '📎'}</span>}
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{f.uploading ? t('uploadingLabel') : f.kind === 'image' ? t('imageLabel') : f.kind === 'pdf' ? t('pdfReadLabel') : f.kind === 'text' && /\.xlsx?$/i.test(f.name) ? t('spreadsheetReadLabel') : f.kind === 'text' ? t('docReadLabel') : t('attachedLabel')}</div>
              </div>
              <button onClick={() => removeAttachedFile(f.localId)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:16, flexShrink:0, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:'8px 10px', borderTop:'1px solid var(--ide-border)', background:'var(--bg-base)', flexShrink:0 }}>
        <div style={{ background:'var(--bg-elevated)', borderRadius:10, border:`1px solid ${input.trim() ? 'var(--ide-border-light)' : 'var(--ide-border)'}`, overflow:'visible', position:'relative', transition:'border-color 0.15s', display:'flex', flexDirection:'column' }}>{mentionQuery !== null && (
            <FileMentionDropdown
              query={mentionQuery}
              files={Object.keys(files ?? {})}
              onSelect={(path) => {
                const base = path.split('/').pop() || path;
                setInput(prev => prev.replace(/@[\w./-]*$/, base + ' '));
                setMentionQuery(null);
                textareaRef.current?.focus();
              }}
              onClose={() => setMentionQuery(null)}
            />
          )}
          {/* Smart prompt suggestions — show contextual chips when input is empty */}
          {!input && !isGenerating && !pendingGenArgs && !pendingPlan && !pendingPlanOffer && credits > 0 && messages.length > 0 && (
            <div style={{ display: 'flex', gap: 4, padding: '6px 10px 0', flexWrap: 'wrap' }}>
              {(Object.keys(files).length > 2 || hasGeneratedFiles
                ? [
                    ...(wyberCloudConnected ? [] : [{ label: t('quickActionAddWyberCloud'), action: 'openCloud' as const }]),
                    { label: t('quickActionDarkMode'), prompt: 'Add a dark/light mode toggle with persistent theme. Use CSS variables for all colors.' },
                    ...(supabaseConnected ? [] : [{ label: t('quickActionConnectSupabase'), prompt: 'Connect Supabase for real auth and database. Replace all mock data with live queries.' }]),
                    { label: t('quickActionAddSettings'), prompt: 'Add a Settings page with profile info, notification preferences, and theme toggle.' },
                    { label: t('quickActionMakeResponsive'), prompt: 'Make the entire app fully responsive. Mobile-first layout, collapsible sidebar, stacked cards on small screens.' },
                  ]
                : [
                    { label: t('quickActionCrmDashboard'), prompt: 'Build a CRM dashboard with leads table, pipeline columns, and KPI cards.' },
                    { label: t('quickActionSaasLanding'), prompt: 'Build a modern SaaS landing page with hero, features, pricing, and CTA sections.' },
                    { label: t('quickActionProjectManager'), prompt: 'Build a project management app with Kanban board, task details, and team view.' },
                    { label: t('quickActionEcommerceStore'), prompt: 'Build an e-commerce store with product grid, shopping cart, and checkout flow.' },
                  ]
              ).slice(0, 4).map(s => {
                const isWyberCloud = 'action' in s && s.action === 'openCloud';
                return (
                <button
                  key={s.label}
                  onClick={() => {
                    if (isWyberCloud) {
                      window.dispatchEvent(new CustomEvent('wyber-open-panel-tab', { detail: 'cloud' }));
                    } else if ('prompt' in s) {
                      setInput(s.prompt);
                      textareaRef.current?.focus();
                    }
                  }}
                  style={isWyberCloud ? {
                    fontSize: 10, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s', whiteSpace: 'nowrap', border: '1px solid transparent',
                    background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: 'white', fontWeight: 600,
                  } : {
                    fontSize: 10, padding: '3px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!isWyberCloud) { (e.target as HTMLElement).style.borderColor = '#0EA5E9'; (e.target as HTMLElement).style.color = '#0EA5E9'; } else { (e.target as HTMLElement).style.opacity = '0.9'; } }}
                  onMouseLeave={e => { if (!isWyberCloud) { (e.target as HTMLElement).style.borderColor = 'var(--ide-border)'; (e.target as HTMLElement).style.color = 'var(--ide-text3)'; } else { (e.target as HTMLElement).style.opacity = '1'; } }}
                >{s.label}</button>
                );
              })}
            </div>
          )}
          <textarea
            ref={textareaRef} value={input}
            onChange={e => {
              const v = e.target.value;
              setInput(v);
              const m = v.slice(0, e.target.selectionStart).match(/@([\w./-]*)$/);
              setMentionQuery(m ? m[1] : null);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={credits <= 0 ? t('noCreditsPlaceholder') : planMode ? t('planModePlaceholder') : pendingGenArgs ? t('pendingKeysPlaceholder') : t('defaultPlaceholder')}
            disabled={isGenerating || !!pendingPlan || !!pendingGenArgs || !!pendingPlanOffer}
            rows={1}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', resize:'none', padding:'10px 12px 6px', fontFamily:'var(--font-sans)', fontSize:13, color:'var(--ide-text)', lineHeight:1.55, minHeight:44, maxHeight:160, overflowY:'auto', letterSpacing:'-0.01em' }}
          />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px 7px', gap: 6 }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', flex: 1 }}>
              <input ref={fileInputRef} type="file" multiple style={{ display:'none' }} onChange={e => { Array.from(e.target.files || []).forEach(handleFile); e.target.value=''; }} />
              <button onClick={() => fileInputRef.current?.click()} title={t('attachFilesTooltip')}
                style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', padding:'3px 5px', borderRadius:5, transition:'var(--t)', display:'flex', alignItems:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <VoiceButton
                size={24}
                disabled={isGenerating}
                lang={LOCALE_SPEECH_CODE[locale]}
                onTranscript={txt => setInput(prev => prev ? prev + ' ' + txt : txt)}
              />
              {/* Model choice: a real, user-selectable picker. Sonnet (fast) is
                  the default SHOWN — but until the user actually changes it,
                  nothing explicit is sent to the server (see tierTouched),
                  so the server's own complexity-aware auto-routing still
                  escalates a genuinely large build to Opus on its own.
                  Opus/Fable/GPT are one click away, each gated by plan (a
                  tier the current plan can't reach is disabled, not hidden —
                  so upgrading is visible, not a secret). */}
              <select
                value={modelTier}
                onChange={e => { setModelTier(e.target.value as ModelTier); setTierTouched(true); }}
                title={t('modelPickerTooltip')}
                style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:6, border:'1px solid var(--ide-border)', cursor:'pointer', fontFamily:'var(--font-sans)', background:'#0c0c12', color:'var(--ide-text)', outline:'none' }}
              >
                {PICKABLE_TIERS.map(tKey => {
                  const meta = MODEL_META[tKey];
                  const allowed = tierAllowedForPlan(tKey, userPlan);
                  const tierCost = creditCost(isFirstBuild ? 'web-build' : 'small-edit', tKey);
                  return (
                    <option key={tKey} value={tKey} disabled={!allowed}>
                      {meta.label} — {tierCost}cr{!allowed ? ` (${meta.minPlan}+)` : ''}
                    </option>
                  );
                })}
              </select>
              {/* Pre-generation cost estimate — an exact number once the user has
                  picked a tier; an honest LOW–HIGH range beforehand, since the
                  actual tier is still up to the server's auto-complexity check. */}
              {(() => {
                const estimateAction: ActionType = isFirstBuild ? 'web-build' : 'small-edit';
                if (tierTouched) {
                  const est = creditCost(estimateAction, modelTier);
                  return (
                    <span title={t('costEstimateTooltip')} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', fontFamily:'var(--font-sans)', letterSpacing:'-0.01em', display:'inline-flex', alignItems:'center', gap:3 }}>
                      ~{est}cr
                    </span>
                  );
                }
                const estLow = creditCost(estimateAction, 'fast');
                const estHigh = creditCost(estimateAction, 'default');
                return (
                  <span title={t('costEstimateTooltip')} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', fontFamily:'var(--font-sans)', letterSpacing:'-0.01em', display:'inline-flex', alignItems:'center', gap:3 }}>
                    ~{estLow === estHigh ? estLow : `${estLow}–${estHigh}`}cr
                  </span>
                );
              })()}
            </div>
            <button
              onClick={isGenerating ? handleStop : handleSend}
              data-send-button="true"
              title={isGenerating ? t('stopGeneratingTooltip') : undefined}
              disabled={!isGenerating && ((!input.trim() && !attachedImage && attachedFiles.length === 0) || !!pendingPlan || !!pendingGenArgs || !!pendingPlanOffer)}
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', flexShrink: 0,
                background: isGenerating ? 'var(--ide-red)' : (!input.trim() && !attachedImage && attachedFiles.length === 0) ? 'var(--bg-overlay)' : 'var(--accent)',
                color: isGenerating ? 'white' : (!input.trim() && !attachedImage && attachedFiles.length === 0) ? 'var(--ide-text3)' : 'white',
                cursor: isGenerating ? 'pointer' : (!input.trim() && !attachedImage && attachedFiles.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: !isGenerating && (input.trim() || attachedImage || attachedFiles.length > 0) ? '0 0 12px var(--brand-glow, rgba(14,165,233,0.35))' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background var(--brand-dur-fast, 0.15s) var(--brand-ease, ease), box-shadow var(--brand-dur-base, 0.24s) var(--brand-ease, ease), transform var(--brand-dur-fast, 0.15s) var(--brand-ease-spring, ease)',
                transform: !isGenerating && (input.trim() || attachedImage || attachedFiles.length > 0) ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {isGenerating
                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} currency={creditsCurrency} trigger={upgradeTrigger} />
    </div>
  );
}
