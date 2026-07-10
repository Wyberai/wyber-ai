'use client'
import { creditCost } from '@/lib/credits';
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback, memo, type ReactNode } from 'react';
import { parseGenerationOutput, parseEditBlocks, cleanStreamingDisplay, extractProgressLines, extractReasoning } from '@/lib/file-parser';
import { applyEdits } from '@/lib/patch-applier';
import { STARTER_TEMPLATES, isPlaceholderApp } from '@/lib/starter-templates';
import { detectDeps, detectDepsInCode, detectRegulated, RegulatedDomain } from '@/lib/detect-deps';
import { classifyIntent } from '@/lib/intent';
import { windowedHistory } from '@/lib/chat-history-window';
import { PlanMode } from './PlanMode';
import { FileMentionDropdown } from './FileMentionDropdown';
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
function cleanMessage(text: string): string {
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
  if (!result || result.length < 3) result = 'Done — check the preview.';
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

// Markdown component overrides: keep everything sized/spaced for a compact
// chat bubble (the parent sets fontSize:12/lineHeight:1.65 — these just fix
// margins/list indentation instead of full browser-default markdown spacing).
// `pre` is where fenced code blocks land (inline code never has a `pre`
// wrapper), so overriding it — not `code` — is what reliably distinguishes a
// real code block from a single backtick-quoted word.
const markdownComponents: Components = {
  p: ({ children }) => <div style={{ margin:'2px 0' }}>{children}</div>,
  h1: ({ children }) => <div style={{ fontWeight:700, fontSize:14, marginTop:8, marginBottom:2 }}>{children}</div>,
  h2: ({ children }) => <div style={{ fontWeight:700, fontSize:13, marginTop:8, marginBottom:2 }}>{children}</div>,
  h3: ({ children }) => <div style={{ fontWeight:700, marginTop:6, marginBottom:2 }}>{children}</div>,
  h4: ({ children }) => <div style={{ fontWeight:700, marginTop:6, marginBottom:2 }}>{children}</div>,
  ul: ({ children }) => <ul style={{ margin:'4px 0', paddingLeft:18 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin:'4px 0', paddingLeft:18 }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom:2 }}>{children}</li>,
  blockquote: ({ children }) => <blockquote style={{ margin:'6px 0', paddingLeft:10, borderLeft:'3px solid var(--ide-border)', color:'var(--ide-text3)' }}>{children}</blockquote>,
  hr: () => <hr style={{ margin:'8px 0', border:'none', borderTop:'1px solid var(--ide-border)' }} />,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)' }}>{children}</a>,
  table: ({ children }) => <div style={{ overflowX:'auto', margin:'6px 0' }}><table style={{ borderCollapse:'collapse', fontSize:11, width:'100%' }}>{children}</table></div>,
  th: ({ children }) => <th style={{ border:'1px solid var(--ide-border)', padding:'4px 8px', textAlign:'left', background:'var(--bg-overlay)', fontWeight:600 }}>{children}</th>,
  td: ({ children }) => <td style={{ border:'1px solid var(--ide-border)', padding:'4px 8px' }}>{children}</td>,
  code: ({ className, children }) => (
    <code style={{ background:'var(--bg-overlay)', padding:'1px 5px', borderRadius:3, fontFamily:'monospace', fontSize:12 }} className={className}>
      {children}
    </code>
  ),
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
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {cleaned}
    </ReactMarkdown>
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

type ModelTier = 'fast' | 'default' | 'premium' | 'fable';
// Model selection is fully automatic (server-side): Opus for from-scratch builds,
// Sonnet for edits, auto-escalating complex edits back to Opus. No user picker.

export function ChatPanel({ projectId, userId, projectType }: Props) {
  const {
    messages, isGenerating, addMessage, updateMessage, setMessages,
    setIsGenerating, streamingContent, setStreamingContent, clearStreamingContent,
    setFiles, files, framework, consumeCredit, credits, hasGeneratedFiles, setHasGeneratedFiles,
    project, setProject, hydrated, knowledge, pushCheckpoint, restoreCheckpoint, checkpoints, initialPrompt,
  } = useEditorStore();

  const resolvedProjectId = projectId || project?.id;
  const resolvedUserId = userId || project?.userId;

  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const isFirstBuild = !hasGeneratedFiles;
  const BUILD_MSGS = isFirstBuild
    ? ['Planning your app...', 'Setting up the design system...', 'Writing components...', 'Wiring up interactions...', 'Adding realistic data...', 'Polishing the UI...', 'Almost there...']
    : ['Applying your changes...', 'Updating components...', 'Refining the code...', 'Almost done...'];

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const attachedFilesRef = useRef<AttachedFile[]>([]);
  const uploadPromisesRef = useRef<Record<string, Promise<unknown>>>({});
  useEffect(() => { attachedFilesRef.current = attachedFiles; }, [attachedFiles]);
  const [dragOver, setDragOver] = useState(false);
  // Kept for the request body; the server ignores it and picks the model itself.
  const [modelTier] = useState<ModelTier>('default');
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

  const [recording, setRecording] = useState(false);
  const connectors = useEditorStore(s => s.connectors);
  const supabaseConnected = connectors.some(c => c.service === 'supabase');
  const [pendingRegulated, setPendingRegulated] = useState<{ prompt: string; img: AttachedImage | null; domains: RegulatedDomain[] } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref so event handlers always get the latest executeGeneration without stale closure
  const executeGenerationRef = useRef<((msg: string, img: AttachedImage | null, opts?: { silent?: boolean; continuation?: boolean }) => Promise<void>) | null>(null);
  // Cap consecutive self-heal (autofix) runs so a broken build can't loop and drain credits.
  const autofixCountRef = useRef(0);
  const MAX_AUTOFIX = 2;
  // Lifted out of executeGeneration's local scope so a user-facing "Stop" button
  // can abort an in-flight generation from outside that closure.
  const abortControllerRef = useRef<AbortController | null>(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunks.current = [];
      mr.ondataavailable = e => audioChunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        try {
          const res = await fetch('/api/voice', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.text) setInput(prev => prev ? prev + ' ' + data.text : data.text);
        } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch { console.error('Mic access denied'); }
  };

  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };

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
      // Stop runaway self-heal: cap consecutive autofix passes per user turn.
      if (autofixCountRef.current >= MAX_AUTOFIX) {
        console.warn('[wyber] self-heal retry cap reached — stopping to protect credits')
        return
      }
      autofixCountRef.current += 1
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
      addMessage({ id: uid(), role: 'assistant', content: `"${file.name}" is larger than 25 MB — please attach a smaller file.`, timestamp: Date.now(), status: 'done' });
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
          addMessage({ id: uid(), role: 'assistant', content: `Couldn't read "${file.name}" as a spreadsheet — it may be corrupted or password-protected.`, timestamp: Date.now(), status: 'done' });
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
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachedImage({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type, name: file.name });
      };
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
      if (target?.kind === 'image') setAttachedImage(null);
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
  useEffect(() => () => { if (saveRetryTimer.current) clearTimeout(saveRetryTimer.current); }, []);

  const saveProject = useCallback((updatedFiles: typeof files) => {
    if (!resolvedProjectId) return;
    pendingSave.current = updatedFiles;
    if (saveRetryTimer.current) { clearTimeout(saveRetryTimer.current); saveRetryTimer.current = null; }

    const attempt = async (): Promise<boolean> => {
      if (!pendingSave.current) return true;
      try {
        const res = await fetch('/api/projects', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, files: pendingSave.current, userId: resolvedUserId || 'auto' }),
        });
        return res.ok;
      } catch { return false; }
    };
    const onSaved = () => {
      pendingSave.current = null;
      if (saveWarned.current) {
        saveWarned.current = false;
        addMessage({ id: uid(), role: 'assistant', content: '✓ Connection restored — all your changes are saved.', timestamp: Date.now(), status: 'done' });
      }
    };

    void (async () => {
      for (const delay of [0, 2000, 6000]) {
        if (delay) await new Promise(r => setTimeout(r, delay));
        if (await attempt()) { onSaved(); return; }
      }
      if (!saveWarned.current) {
        saveWarned.current = true;
        addMessage({ id: uid(), role: 'assistant', content: '⚠ **I can\'t reach the server to save your latest changes.** Your work is safe in this tab and I\'ll keep retrying — just don\'t close it until you see the saved confirmation.', timestamp: Date.now(), status: 'done' });
      }
      const loop = async () => {
        if (await attempt()) { onSaved(); return; }
        saveRetryTimer.current = setTimeout(loop, 20_000);
      };
      saveRetryTimer.current = setTimeout(loop, 20_000);
    })();
  }, [resolvedProjectId, resolvedUserId, addMessage]);

  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null, opts?: { silent?: boolean; continuation?: boolean; echoedUser?: boolean; displayContent?: string }) => {
    // Clear any stale progress steps/reasoning from a previous generation before starting
    setProgressSteps([]);
    setLiveReasoning('');
    // A fresh user-initiated turn resets the self-heal budget (silent autofix runs do not).
    if (!opts?.silent) autofixCountRef.current = 0;

    // Out of credits → block builds/edits (self-heal is free, so let it through).
    // Conversational messages never reach here; they go through handleConversational.
    if (!opts?.silent && credits <= 0) {
      addMessage({ id: uid(), role: 'user', content: userMsg, timestamp: Date.now(), status: 'done' });
      addMessage({ id: uid(), role: 'assistant', content: "You're out of credits, so I can't build or edit right now — but questions are still free. Top up to keep building.", timestamp: Date.now(), status: 'done' });
      return;
    }

    // Snapshot current files for undo BEFORE generation
    if (Object.keys(files ?? {}).length > 0) pushCheckpoint((opts?.displayContent ?? userMsg).slice(0, 40) || 'Before edit');

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
    return;
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
    const allFileEntries = Object.entries(files);
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
    try {
      const res = await fetch('/api/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        signal: genController.signal,
        body: JSON.stringify({
          prompt: userMsg || (img ? 'Build a UI matching this screenshot exactly.' : 'Build this using the attached files.'),
          framework, fileContext, history, knowledge: knowledgeStr, modelTier,
          userId: resolvedUserId, projectId: resolvedProjectId,
          projectType, selfHeal: isSelfHeal,
          // The server can't infer "first build" from fileContext — the
          // auto-seeded starter scaffold makes it non-empty on the very first
          // message, so its length heuristic classified EVERY build as an
          // edit (wrong price, Sonnet instead of Opus, no naming pass). Sent
          // explicitly from the store's per-project flag instead.
          isFirstBuild: !useEditorStore.getState().hasGeneratedFiles,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
          assets: assets.length ? assets : undefined,
          attachedText: attachedTextPayload.length ? attachedTextPayload : undefined,
          documents: attachedDocuments.length ? attachedDocuments : undefined,
        }),
      });

      if (!res.ok) {
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
      if (creditsUsed) setLastCreditCost(parseInt(creditsUsed));
      if (modelUsed) setLastModel(modelUsed);

      // Server already deducted credits before streaming. Refresh balance from API.
      const isPrebuilt = xSource === 'prebuilt';
      if (isPrebuilt) {
        // Prebuilt is free — restore the optimistic deduction the store may have applied
        useEditorStore.getState().setCredits(credits);
      } else {
        // Fetch fresh balance after server deduction
        fetch('/api/credits/deduct', { method: 'GET' })
          .then(r => r.json())
          .then(data => { if (data.credits !== undefined) useEditorStore.getState().setCredits(data.credits); })
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
          ? [`📦 Big build — ${fileTagCount} files so far, generating in batches. The preview loads automatically when the last one lands.`]
          : [];
        if (steps.length > 0 || batchNotice.length > 0) setProgressSteps([...batchNotice, ...steps]);

        // Live extended-thinking text (opt-in, new-build full generation only)
        const reasoningSoFar = extractReasoning(full);
        if (reasoningSoFar) setLiveReasoning(reasoningSoFar);

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

      // 4c. Auto-apply the generated database schema. Supabase builds end with
      // a "SQL TO RUN IN SUPABASE DASHBOARD" comment block — historically the
      // user had to copy it into the SQL editor by hand, and nobody did, so
      // every insert hit a missing table and silently failed ("frontend works,
      // backend doesn't"). OAuth-connected projects get it run automatically
      // via the Management API; anon-key-only connections get the SQL surfaced
      // as an explicit action item instead of buried in generated code.
      const sqlMatch = full.match(/\/\*\s*SQL TO RUN IN SUPABASE[^\n]*\n([\s\S]*?)\*\//i)
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
      if (schemaSql && resolvedProjectId) {
        fetch('/api/connectors/supabase/apply-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, sql: schemaSql }),
        }).then(r => r.json()).then((d: { applied?: boolean; reason?: string; error?: string }) => {
          if (d.applied) {
            addMessage({ id: uid(), role: 'assistant', content: '🗄 **Database tables set up automatically** in your connected Supabase project — your data now persists for real.', timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'oauth-expired') {
            addMessage({ id: uid(), role: 'assistant', content: '🗄 **Your Supabase connection expired**, so I couldn\'t create the database tables automatically. Click the Supabase button in the top bar and reconnect, then ask me to "set up my database tables" and I\'ll finish the job. (Or run the SQL below in Supabase → SQL Editor yourself.)\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'no-oauth') {
            addMessage({ id: uid(), role: 'assistant', content: '🗄 **One manual step to make data persist:** your Supabase connection doesn\'t let me create tables automatically. Open Supabase → SQL Editor and run:\n\n```sql\n' + schemaSql + '\n```\n\nTip: reconnect Supabase with the one-click connect button to enable automatic setup next time.', timestamp: Date.now(), status: 'done' });
          } else if (d.reason === 'sql-error') {
            addMessage({ id: uid(), role: 'assistant', content: '⚠ I tried to create your database tables in Supabase but hit an error:\n\n```\n' + (d.error || 'unknown') + '\n```\n\nRun this in Supabase → SQL Editor instead:\n\n```sql\n' + schemaSql + '\n```', timestamp: Date.now(), status: 'done' });
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
              content: '🗄 **This template uses Supabase** for its database and auth. Connect your Supabase project to make login and data persistence work — open the **Connectors** tab in the right panel.',
              timestamp: Date.now(), status: 'done',
            });
          }, 400);
        } else if (codeDeps.needsStripe) {
          setTimeout(() => {
            addMessage({
              id: uid(), role: 'assistant',
              content: '💳 **This template includes Stripe payments.** Add your `STRIPE_SECRET_KEY` in the Connectors tab to enable checkout.',
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
            ? "⏳ **The response was cut off before any file finished.** Continuing automatically below — the changes land in the next message."
            : emittedNothing
            ? "**Something went wrong** — the model returned an empty response, so nothing was changed. You weren't charged for this. Please try again."
            : "**Nothing was actually changed** — the model responded but didn't produce any file changes, so the app is unmodified. You weren't charged for this. If your message included a large paste (a big table, a long document), try splitting it into smaller pieces and asking again.";
          updateMessage(assistantId, { content: errMsg, status: (fileCut || editCut) ? 'done' : 'error', retryPrompt: userMsg, retryLane: 'build' });
          persistMessage('assistant', errMsg);
        }
        setLiveReasoning('');
        return;
      }

      // Always run through cleanMessage so stored content is already scrubbed.
      // cleanMessage never returns empty (it has its own generic fallback) —
      // swap that fallback for a continuation-specific receipt when this run
      // was finishing a cut build, so the chat says what actually happened.
      let finalContent = cleanMessage(chatText);
      if (opts?.continuation && finalContent === 'Done — check the preview.') {
        finalContent = '✓ Finished applying the remaining files — the build is complete. Check the preview.';
      }
      // A cut stream means the turn ends mid-work — say so, or the preamble
      // reads as a finished summary ("…Let me look at App.tsx:") and the user
      // waits on nothing. The continuation that follows is a visible bubble.
      if (fileCut || editCut) {
        finalContent += '\n\n⏳ **Hit the output limit mid-file — continuing automatically below.** The rest of this build lands in the next message (no extra charge).';
      }
      // Extended-thinking output (opt-in, new-build full generation only) — kept
      // client-side only for this session's collapsible display, not persisted
      // to project_messages (no schema for it yet, and it's not needed on reload).
      const finalReasoning = extractReasoning(full);
      if (isVisible) {
        updateMessage(assistantId, {
          content: finalContent,
          status:'done',
          filesChanged: newFiles.map(f => f.path),
          reasoning: finalReasoning || undefined,
        });
        persistMessage('assistant', finalContent, newFiles.map(f => f.path));
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
            content: "⚠ I couldn't reach your connected Supabase project, so this build doesn't have a working database. Check your keys in the Connectors tab, then ask me to rebuild the data layer.",
            timestamp: Date.now(), status: 'done',
          });
        }, 300);
      }

    } catch (err: unknown) {
      if (isVisible) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        // fetch() surfaces a dropped connection (sleep/suspend, wifi drop, VPN
        // blip) as a bare TypeError — the build usually FINISHES on the server
        // and rescue-persist saves it, so point the user at reload, not retry.
        const isNetworkDrop = !isAbort && err instanceof TypeError;
        const errMsg = isAbort
          ? (userStoppedRef.current
              ? "**Stopped.** You cancelled this build before it finished — check if your credits were deducted before trying again, and reload the project to see what (if anything) landed."
              : "**This build timed out** after taking too long to respond. It may have finished on the server even though this connection gave up waiting — check if your credits were deducted before trying again, and reload the project to see if the changes landed.")
          : isNetworkDrop
          ? "**Your connection dropped mid-build** (this happens when the computer sleeps or wifi blips). The build kept running on the server and gets saved to your project automatically — **wait ~30 seconds, then reload this page** and your files should be here. Only retry if nothing landed after reloading."
          : `**Error:** ${err instanceof Error ? err.message : 'Unknown error'}`;
        updateMessage(assistantId, { content: errMsg, status:'error', retryPrompt: userMsg, retryLane: 'build' });
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
  }, [credits, files, messages, framework, resolvedProjectId, resolvedUserId, modelTier, knowledge, addMessage, updateMessage, setIsGenerating, setStreamingContent, clearStreamingContent, consumeCredit, setFiles, hasGeneratedFiles, setHasGeneratedFiles, saveProject, persistMessage, pushCheckpoint, project, setProject]);

  // Assign on every render so the autofix event handler always has the latest closure
  executeGenerationRef.current = executeGeneration;

  const handleUndo = useCallback(() => {
    if (checkpoints.length === 0) return;
    const last = checkpoints[checkpoints.length - 1];
    restoreCheckpoint(last.id);
    const updated = last.files;
    saveProject(updated as any);
    addMessage({ id: uid(), role:'assistant', content:`↩ Reverted to "${last.label}"`, timestamp:Date.now(), status:'done' });
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
    await executeGeneration(prompt, img);
    // Tell the Connectors panel to refresh only after the triggered build
    // finishes — firing this right after the vault save made the panel show
    // "✓ Connected" while "Applying changes..." was still spinning, which
    // read as a stuck/contradictory state even though both were accurate.
    window.dispatchEvent(new CustomEvent('wyber:secrets-saved'));
  }, [pendingGenArgs, inlineSecrets, executeGeneration]);

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

      if (!res.ok) throw new Error(await res.text());

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
          || 'That change needs a build — say "go ahead" and I\'ll run it.';
        updateMessage(assistantId, { content: full });
      }
      if (!created) {
        // Empty reply — degrade gracefully, still no charge.
        setChatThinking(false);
        addMessage({ id: assistantId, role: 'assistant', content: 'Sorry, I didn’t catch that — could you rephrase?', timestamp: Date.now(), status: 'done' });
        full = 'Sorry, I didn’t catch that — could you rephrase?';
      }
      persistMessage('assistant', full);
    } catch (err) {
      setChatThinking(false);
      const errMsg = `**Error:** ${err instanceof Error ? err.message : 'Could not reach the assistant'}`;
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
  const dispatchTurn = useCallback(async (content: string, img: AttachedImage | null, hasAttachments = false) => {
    const isNewBuild = Object.keys(files ?? {}).length === 0;
    if (!img && !hasAttachments) {
      const intent = classifyIntent(content, !isNewBuild);
      if (intent === 'CHAT' || intent === 'AMBIGUOUS') {
        await handleConversational(content, img, intent === 'CHAT');
        return;
      }
    }
    await executeGeneration(content, img);
  }, [files, handleConversational, executeGeneration]);

  // Everything that runs once the user has settled on "just build it" —
  // regulated-domain notice, pre-gen dep gate, then the intent router. Pulled
  // out of handleSend so the plan-offer gate's "Just build it" button can run
  // the exact same path without duplicating it a third time (pendingRegulated
  // already duplicates it once, for its own "continue" button).
  const proceedPastPlanOffer = useCallback(async (userMsg: string, img: AttachedImage | null, hasAttachments: boolean) => {
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
    await dispatchTurn(userMsg, img, hasAttachments);
  }, [files, dispatchTurn]);

  const handleSend = useCallback(async () => {
    // No credits<=0 gate here — conversational messages are FREE, so the box
    // stays usable at 0 credits. The build/edit path is blocked separately in
    // executeGeneration with a clear "out of credits" message.
    if ((!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating) return;
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
              title="Undo last change"
              style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600, letterSpacing:'-0.01em', transition:'var(--t)' }}
            >
              ↩ Undo
            </button>
          )}
          <button
            onClick={() => setPlanMode(v => !v)}
            title="Plan Mode"
            style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:`1px solid ${planMode ? 'var(--accent-dim)' : 'var(--ide-border)'}`, background: planMode ? 'var(--accent-glow)' : 'transparent', color: planMode ? 'var(--accent)' : 'var(--ide-text3)', cursor:'pointer', fontWeight:600, letterSpacing:'-0.01em', transition:'var(--t)' }}
          >
            ◎ Plan
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
            onApprove={(planSpec) => {
              const { image, prompt: originalPrompt } = pendingPlan;
              setPendingPlan(null);
              // The model gets the full plan spec (title/approach/steps/Q&A);
              // the chat bubble shows the user's own original words instead —
              // a giant technical spec dumped into the thread would look
              // nothing like a normal message.
              executeGeneration(planSpec, image, { displayContent: originalPrompt });
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
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ide-text)', letterSpacing:'-0.01em' }}>Want to see a plan first?</div>
              <div style={{ fontSize:11, color:'var(--ide-text3)', marginTop:1 }}>
                I can sketch the file structure and approach before writing any code — you can edit or approve it. Or I can just build it now.
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            <button
              onClick={() => {
                const { prompt, img } = pendingPlanOffer;
                setPendingPlanOffer(null);
                setPendingPlan({ prompt, image: img });
              }}
              style={{ flex:1, padding:'7px 0', borderRadius:7, border:'none', background:'var(--accent)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}
            >
              Show me a plan ({creditCost('plan', 'default')} credits)
            </button>
            <button
              onClick={async () => {
                const { prompt, img, hasAttachments } = pendingPlanOffer;
                setPendingPlanOffer(null);
                await proceedPastPlanOffer(prompt, img, hasAttachments);
              }}
              style={{ padding:'7px 14px', borderRadius:7, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              Just build it
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
                Regulated data detected — read before building
              </div>
              <div style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.6 }}>
                This prompt involves{' '}
                <strong style={{ color: '#fef3c7' }}>
                  {pendingRegulated.domains.map(d => d.label).join(' and ')}
                </strong>
                {' '}— a regulated category. Real data of this type requires:
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
            Wyber's default storage is <strong style={{ color: '#f87171' }}>not suitable for real regulated data</strong>. Build here for prototyping and UI design only — connect your own compliant infrastructure before handling any real records.
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
              I understand — build as prototype only →
            </button>
            <button
              onClick={() => { setPendingRegulated(null); setInput(pendingRegulated.prompt) }}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
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
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ide-text)', letterSpacing:'-0.01em' }}>One thing before we build</div>
              <div style={{ fontSize:11, color:'var(--ide-text3)', marginTop:1 }}>
                This app needs external services. Add your keys now or skip and build a demo version.
              </div>
            </div>
          </div>

          {/* Supabase section */}
          {pendingGenArgs.needsSupabase && (
            <div style={{ background:'rgba(63,207,142,0.06)', border:'1px solid rgba(63,207,142,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>🗄</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#3FCF8E' }}>Supabase</span>
                <span style={{ fontSize:11, color:'var(--ide-text3)' }}>— database + auth</span>
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
                  Find these in your Supabase project → Settings → API
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
                <span style={{ fontSize:11, color:'var(--ide-text3)' }}>— payments</span>
              </div>
              <input
                placeholder="pk_live_... or pk_test_..."
                value={inlineSecrets['STRIPE_PUBLISHABLE_KEY'] ?? ''}
                onChange={e => setInlineSecrets(s => ({ ...s, 'STRIPE_PUBLISHABLE_KEY': e.target.value }))}
                style={{ width:'100%', padding:'6px 9px', borderRadius:6, border:'1px solid rgba(99,91,255,0.2)', background:'var(--bg-elevated)', color:'var(--ide-text)', fontSize:11, fontFamily:'monospace', outline:'none' }}
              />
              <div style={{ fontSize:10, color:'var(--ide-text3)', marginTop:5 }}>
                Find this in dashboard.stripe.com → Developers → API keys
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
                🔗 Connected tools needed: {pendingGenArgs.composioTools.join(', ')}
              </div>
              <div style={{ fontSize:11, color:'var(--ide-text3)' }}>
                Connect these via the <strong>Agents</strong> canvas → Browse Tools → OAuth. Build with mock data for now and connect later.
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
              {secretSaving ? 'Saving…' : 'Save keys & build →'}
            </button>
            <button
              onClick={() => {
                const { prompt, img } = pendingGenArgs;
                setPendingGenArgs(null);
                setInlineSecrets({});
                executeGeneration(prompt, img);
              }}
              style={{ padding:'7px 14px', borderRadius:7, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              Build without backend
            </button>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────── */}

      {dragOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(124,110,247,0.1)', border:'2px dashed var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, pointerEvents:'none' }}>
          <span style={{ fontSize:14, color:'var(--accent)', fontWeight:500 }}>Drop files to attach — images, docs, anything</span>
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
                      <button onClick={handleCancelEdit} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                      <button onClick={handleSaveEdit} disabled={!editingText.trim()} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', background:'var(--accent)', color:'#fff', cursor: editingText.trim() ? 'pointer' : 'not-allowed', fontWeight:600, opacity: editingText.trim() ? 1 : 0.5 }}>Save & regenerate</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'flex-end', gap:5 }}>
                  {!isGenerating && !msg.content.startsWith('[Image:') && (
                    <button
                      onClick={() => handleStartEdit(msg)}
                      title="Edit and regenerate from here"
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
                          {progressSteps.length > 0
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
                                🧠 {expandedReasoning.has(msg.id) ? 'Hide reasoning' : 'Show reasoning'}
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
                                  {detailsOpen ? 'Hide details' : 'Show details'}
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
                  {(msg.status === 'done' || msg.status === 'error') && (
                    <div style={{ marginTop:5, display:'flex', gap:4 }}>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title="Copy message"
                        style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color: copiedMessageId === msg.id ? 'var(--ide-green)' : 'var(--ide-text3)', cursor:'pointer', fontWeight:600 }}
                      >
                        {copiedMessageId === msg.id ? '✓ Copied' : 'Copy'}
                      </button>
                      {msg.status === 'error' && msg.retryPrompt && !isGenerating && (
                        <button
                          onClick={() => handleRetry(msg.id)}
                          title="Retry this message"
                          style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/></svg>
                          Retry
                        </button>
                      )}
                    </div>
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
                <span className="ide-shimmer-text">Thinking…</span>
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
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{f.uploading ? 'Uploading…' : f.kind === 'image' ? 'Image' : f.kind === 'pdf' ? 'PDF · read in full' : f.kind === 'text' && /\.xlsx?$/i.test(f.name) ? 'Spreadsheet · read as data' : f.kind === 'text' ? 'Doc · text read' : 'Attached'}</div>
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
                    { label: 'Add dark mode', prompt: 'Add a dark/light mode toggle with persistent theme. Use CSS variables for all colors.' },
                    ...(supabaseConnected ? [] : [{ label: 'Connect Supabase', prompt: 'Connect Supabase for real auth and database. Replace all mock data with live queries.' }]),
                    { label: 'Add settings page', prompt: 'Add a Settings page with profile info, notification preferences, and theme toggle.' },
                    { label: 'Make responsive', prompt: 'Make the entire app fully responsive. Mobile-first layout, collapsible sidebar, stacked cards on small screens.' },
                  ]
                : [
                    { label: 'CRM dashboard', prompt: 'Build a CRM dashboard with leads table, pipeline columns, and KPI cards.' },
                    { label: 'SaaS landing page', prompt: 'Build a modern SaaS landing page with hero, features, pricing, and CTA sections.' },
                    { label: 'Project manager', prompt: 'Build a project management app with Kanban board, task details, and team view.' },
                    { label: 'E-commerce store', prompt: 'Build an e-commerce store with product grid, shopping cart, and checkout flow.' },
                  ]
              ).slice(0, 4).map(s => (
                <button key={s.label} onClick={() => { setInput(s.prompt); textareaRef.current?.focus() }}
                  style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#0EA5E9'; (e.target as HTMLElement).style.color = '#0EA5E9' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--ide-border)'; (e.target as HTMLElement).style.color = 'var(--ide-text3)' }}
                >{s.label}</button>
              ))}
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
            placeholder={credits <= 0 ? 'No credits — questions are free; top up to build' : planMode ? 'Plan mode active — describe what to build...' : pendingGenArgs ? 'Add your keys above, or click "Build without backend"' : 'Ask anything or describe what you want to build...'}
            disabled={isGenerating || !!pendingPlan || !!pendingGenArgs || !!pendingPlanOffer}
            rows={1}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', resize:'none', padding:'10px 12px 6px', fontFamily:'var(--font-sans)', fontSize:13, color:'var(--ide-text)', lineHeight:1.55, minHeight:44, maxHeight:160, overflowY:'auto', letterSpacing:'-0.01em' }}
          />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px 7px', gap: 6 }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', flex: 1 }}>
              <input ref={fileInputRef} type="file" multiple style={{ display:'none' }} onChange={e => { Array.from(e.target.files || []).forEach(handleFile); e.target.value=''; }} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach files — images, docs, anything"
                style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', padding:'3px 5px', borderRadius:5, transition:'var(--t)', display:'flex', alignItems:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button onClick={recording ? stopRecording : startRecording} title={recording ? 'Stop recording' : 'Voice input'}
                style={{ background: recording ? 'rgba(239,68,68,0.1)' : 'none', border:'none', color: recording ? 'var(--ide-red)' : 'var(--ide-text3)', cursor:'pointer', padding:'3px 5px', borderRadius:5, transition:'var(--t)', display:'flex', alignItems:'center' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="1" width="6" height="9" rx="3"/><path d="M1 8a7 7 0 0014 0M8 15v-2"/></svg>
              </button>
              {/* Automatic model routing — system picks the best model per task */}
              <span
                title="WyberAi automatically picks the best model: top-tier for new builds, a fast model for quick edits. You only pay for what each change needs."
                style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background:'transparent', color:'var(--ide-text3)', fontFamily:'var(--font-sans)', letterSpacing:'-0.01em', display:'inline-flex', alignItems:'center', gap:4 }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Auto
              </span>
            </div>
            <button
              onClick={isGenerating ? handleStop : handleSend}
              data-send-button="true"
              title={isGenerating ? 'Stop generating' : undefined}
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
    </div>
  );
}
