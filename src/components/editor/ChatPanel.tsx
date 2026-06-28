'use client'
import { CreditEstimateBar } from '@/components/shared/CreditEstimateBar'
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback } from 'react';
import { parseGenerationOutput, parseEditBlocks, cleanStreamingDisplay, extractProgressLines } from '@/lib/file-parser';
import { applyEdits } from '@/lib/patch-applier';
import { parsePlanManifest, buildStagedPlan, forgeLine } from '@/lib/staged-plan';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';
import { detectDeps, detectDepsInCode, detectRegulated, RegulatedDomain } from '@/lib/detect-deps';
import { classifyIntent } from '@/lib/intent';
import { PlanMode } from './PlanMode';
import { FileMentionDropdown } from './FileMentionDropdown';

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

function cleanMessage(text: string): string {
  let t = text;
  t = t.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  t = t.replace(/<file[^\s>]*[^>]*>[\s\S]*?<\/file>/gi, '');
  t = t.replace(/<edit\s+path="[^"]*">[\s\S]*?<\/edit>/gi, '');
  // cut any unclosed trailing block (stream/save ended mid-block)
  const _cuts = [t.search(/<thinking>/i), t.search(/<file/i), t.search(/<edit\s+path="/i)].filter(i => i !== -1);
  if (_cuts.length) t = t.slice(0, Math.min(..._cuts));
  // strip progress markers — these belong in the checklist, never in chat text
  t = t.replace(/\[progress:[^\]]+\]/gi, '');
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
    // continuation/self-heal reasoning openers
    if (/^(i notice|i see that|i'll continue|let me continue|continuing|previous output|your previous|it seems|it looks like)/i.test(l)) return false;
    // file-list headers
    if (/^(here(?:'s| are)|the following files|these files|i(?:'m| will| am) (?:now |going to )?(?:build|creat|generat|output|provid))/i.test(l)) return false;
    return true;
  });
  const builtLine = lines.find(l => l.startsWith('Built:'));
  if (builtLine) return builtLine;
  let result = lines.join('\n').trim();
  // Keep responses short — take first 2 sentences max
  const sentences = result.split(/(?<=[.!])\s+/).filter(s => s.length > 5);
  if (sentences.length > 2) result = sentences.slice(0, 2).join(' ');
  // Strip technical jargon patterns
  result = result.replace(/\b(I'll|I will|I've|I have|I am|I'm going to|Let me|Here's what I did|Here's the)\b/gi, '').trim();
  result = result.replace(/^\s*[-—–]\s*/gm, '');
  result = result.replace(/\s{2,}/g, ' ').trim();
  if (!result || result.length < 3) result = 'Done — check the preview.';
  return result;
}

function renderMessage(text: string) {
  const cleaned = cleanMessage(text);
  const parts = cleaned.split(/(```edited:[^`]+```|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```edited:')) return null;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background:'var(--bg-overlay)', padding:'1px 5px', borderRadius:3, fontFamily:'monospace', fontSize:11 }}>{part.slice(1,-1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

interface AttachedImage { dataUrl: string; base64: string; mimeType: string; name: string; }
type AttachedKind = 'image' | 'text' | 'file';
interface AttachedFile { localId: string; name: string; mimeType: string; kind: AttachedKind; size: number; url?: string; text?: string; uploading: boolean; }
const TEXT_FILE_RE = /\.(txt|md|markdown|csv|tsv|json|ya?ml|html?|xml|css|scss|js|jsx|ts|tsx|py|rb|go|rs|java|php|sql|sh|env|toml|ini|log)$/i;
const isTextFile = (f: File) => f.type.startsWith('text/') || f.type === 'application/json' || TEXT_FILE_RE.test(f.name);
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
    project, hydrated, knowledge, pushCheckpoint, restoreCheckpoint, checkpoints,
  } = useEditorStore();

  const resolvedProjectId = projectId || project?.id;
  const resolvedUserId = userId || project?.userId;

  const [input, setInput] = useState('');
  const [buildMsgIdx, setBuildMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const isFirstBuild = !hasGeneratedFiles;
  const BUILD_MSGS = isFirstBuild
    ? ['Planning your app...', 'Setting up the design system...', 'Writing components...', 'Wiring up interactions...', 'Adding realistic data...', 'Polishing the UI...', 'Almost there...']
    : ['Applying your changes...', 'Updating components...', 'Refining the code...', 'Almost done...'];

  useEffect(() => {
    if (!isGenerating) { setBuildMsgIdx(0); setElapsed(0); return; }
    setProgressSteps([]);
    const startTime = Date.now();
    const t = setInterval(() => {
      setBuildMsgIdx(i => (i + 1) % BUILD_MSGS.length);
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [isGenerating]);
  const buildMsg = BUILD_MSGS[buildMsgIdx];

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
  const [pendingGenArgs, setPendingGenArgs] = useState<{ prompt: string; img: AttachedImage | null; needsSupabase: boolean; needsStripe: boolean; composioTools: string[] } | null>(null);
  // Inline secret collection for the gate UI (key name → value)
  const [inlineSecrets, setInlineSecrets] = useState<Record<string, string>>({});
  const [secretSaving, setSecretSaving] = useState(false);
  // Live progress steps shown during streaming
  const [progressSteps, setProgressSteps] = useState<string[]>([]);

  const [recording, setRecording] = useState(false);
  const [dismissedNoPersist, setDismissedNoPersist] = useState(false);
  const [pendingRegulated, setPendingRegulated] = useState<{ prompt: string; img: AttachedImage | null; domains: RegulatedDomain[] } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref so event handlers always get the latest executeGeneration without stale closure
  const executeGenerationRef = useRef<((msg: string, img: AttachedImage | null, opts?: { silent?: boolean }) => Promise<void>) | null>(null);
  // Cap consecutive self-heal (autofix) runs so a broken build can't loop and drain credits.
  const autofixCountRef = useRef(0);
  const MAX_AUTOFIX = 2;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, streamingContent]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // Persist a message to Supabase
  const persistMessage = useCallback((role: 'user'|'assistant', content: string, filesChanged?: string[]) => {
    if (!resolvedProjectId) return;
    fetch('/api/projects/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: resolvedProjectId, role, content, filesChanged: filesChanged || [] }),
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
    const greeting = { id: uid(), role:'assistant' as const, content:`**WyberAi ready** — describe what to build, paste a screenshot, or pick a template.`, timestamp:Date.now(), status:'done' as const };
    addMessage(greeting);
  }, [hydrated, hasInit, files, messages, framework, setFiles, addMessage]);

  // Auto-trigger generation if a prompt was passed from dashboard/homepage
  useEffect(() => {
    if (!resolvedProjectId || !hasInit) return;
    const key = `wyber_prompt_${resolvedProjectId}`;
    const savedPrompt = sessionStorage.getItem(key);
    if (!savedPrompt) return;
    sessionStorage.removeItem(key);
    const timer = setTimeout(() => {
      setInput(savedPrompt);
      window.dispatchEvent(new CustomEvent('wyber_auto_generate', { detail: { prompt: savedPrompt } }));
    }, 800);
    return () => clearTimeout(timer);
  }, [resolvedProjectId, hasInit]);

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
      executeGenerationRef.current?.(detail.prompt, null, { silent: true })
    }
    window.addEventListener('wyber-autofix', autofixHandler)
    return () => {
      window.removeEventListener('wyber_auto_generate', handler as EventListener)
      window.removeEventListener('wyber-autofix', autofixHandler)
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

  const saveProject = useCallback(async (updatedFiles: typeof files) => {
    if (!resolvedProjectId) return;
    fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ projectId: resolvedProjectId, files: updatedFiles, userId: resolvedUserId || "auto" }) }).catch(() => {});
  }, [resolvedProjectId, resolvedUserId]);

  // ── Staged generation: plan → scaffold → fill batches ──
  // Returns true if it handled the build (staged), false to fall back to one-shot.
  const runStagedBuild = useCallback(async (userMsg: string, assistantId: string): Promise<boolean> => {
    return false; // STAGING DISABLED — rebuild cleanly next session
    try {
      // STAGE A — Plan: get the file manifest (fast, cheap)
      setStreamingContent('Planning the build…')
      const planRes = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg, stage: 'plan', modelTier,
          userId: resolvedUserId, projectId: resolvedProjectId,
        }),
      })
      console.log('[WYBER] plan status', planRes.status); if (!planRes.ok) { setStreamingContent('STAGED FAILED: plan call returned ' + planRes.status); return false }
      const planReader = planRes.body!.getReader()
      const planDecoder = new TextDecoder()
      let planRaw = ''
      while (true) {
        const { done, value } = await planReader.read()
        if (done) break
        planRaw += planDecoder.decode(value, { stream: true })
      }
      const manifest = parsePlanManifest(planRaw)
      const plan = buildStagedPlan(manifest); setStreamingContent('STAGED: parsed ' + manifest.length + ' files, shouldStage=' + plan.shouldStage); await new Promise(r=>setTimeout(r,1500));
      if (!plan.shouldStage) return false  // simple app → one-shot fallback

      const langMap: Record<string,string> = { ts:'typescript', tsx:'typescript', js:'javascript', jsx:'javascript', css:'css', html:'html', json:'json', vue:'vue' }
      let working = { ...files }
      const forgeLog: string[] = []
      const pushForge = (line: string) => { forgeLog.push('✓ ' + line); setStreamingContent('⚒ Forging your app\n\n' + forgeLog.join('\n')) }

      // Helper: run one stage call, merge files, rebuild preview
      const runPass = async (stage: 'scaffold'|'fill', paths: string[], logLine: string): Promise<boolean> => {
        setStreamingContent('⚒ Forging your app\n\n' + forgeLog.join('\n') + (forgeLog.length?'\n':'') + '◌ ' + logLine)
        const doCall = async () => {
          const res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: userMsg, stage, stageFiles: paths, modelTier,
              fileContext: stage==='fill' ? Object.entries(working).map(([p,f]:any)=>`<file path="${p}">\n${(f.content||'').slice(0,4000)}\n</file>`).join('\n\n') : '',
              userId: resolvedUserId, projectId: resolvedProjectId,
            }),
          })
          if (!res.ok) throw new Error(await res.text())
          const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = ''
          while (true) { const { done, value } = await reader.read(); if (done) break; full += dec.decode(value, { stream:true }) }
          const { files: nf } = parseGenerationOutput(full)
          if (nf.length === 0) throw new Error('No files produced in ' + stage + ' pass')
          for (const { path, content } of nf) {
            const ext = path.split('.').pop() ?? ''
            working[path] = { path, content, language: langMap[ext] ?? 'plaintext' }
          }
          return true
        }
        try { await doCall() } catch { try { await doCall() } catch { return false } } // one auto-retry
        setFiles({ ...working }); setHasGeneratedFiles(true); await saveProject(working)
        pushForge(logLine)
        return true
      }

      // STAGE B — Scaffold
      const okScaffold = await runPass('scaffold', plan.scaffoldPaths, forgeLine([], 'scaffold'))
      if (!okScaffold) return false

      // STAGE C — Fill batches
      for (const batch of plan.fillBatches) {
        const ok = await runPass('fill', batch.map(b=>b.path), forgeLine(batch, 'fill'))
        if (!ok) {
          // batch failed after retry → calm error, but keep everything built so far
          setStreamingContent('')
          addMessage({ id: uid(), role:'assistant', content:`I built the shell and most features, but one part ("${forgeLine(batch,'fill')}") needs another pass. Tap "Try to fix" in the preview, or ask me to finish it.`, timestamp:Date.now(), status:'done' })
          persistMessage('assistant', 'Partial build — one batch needs a retry.')
          return true
        }
      }

      // Done
      setStreamingContent('')
      const summary = `Built your app in ${plan.fillBatches.length + 1} stages — ${plan.files.length} files. Take a look at the preview.`
      addMessage({ id: assistantId, role:'assistant', content: summary, timestamp:Date.now(), status:'done' })
      persistMessage('assistant', summary)
      return true
    } catch {
      return false  // any unexpected error → fall back to one-shot
    }
  }, [files, modelTier, resolvedUserId, resolvedProjectId, setFiles, setHasGeneratedFiles, saveProject, addMessage, persistMessage, setStreamingContent])


  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null, opts?: { silent?: boolean; echoedUser?: boolean }) => {
    // Clear any stale progress steps from a previous generation before starting
    setProgressSteps([]);
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
    if (Object.keys(files ?? {}).length > 0) pushCheckpoint(userMsg.slice(0, 40) || 'Before edit');

    // Self-heal/autofix runs (silent) are FREE — they repair work the user
    // already paid for. Skip the optimistic client decrement; the server is
    // told `selfHeal: true` below and skips the deduction entirely.
    const isSelfHeal = !!opts?.silent;
    if (!isSelfHeal) consumeCredit();
    const userContent = img ? `[Image: ${img.name}]\n${userMsg || 'Build a UI matching this screenshot'}` : userMsg;
    // echoedUser: the conversational lane already added the user's bubble before
    // it decided this was actually a build — don't duplicate it.
    if (!opts?.silent && !opts?.echoedUser) {
      addMessage({ id: uid(), role:'user', content: userContent, timestamp:Date.now(), status:'done' });
      persistMessage('user', userContent);
    }
const storeProjectId = useEditorStore.getState().project?.id;
  if (resolvedProjectId && storeProjectId && storeProjectId !== resolvedProjectId) {
    console.warn('Blocked generation: project mismatch');
    return;
  }
    const assistantId = uid();
    // Silent (autofix/self-heal) runs produce no visible assistant bubble — files are applied invisibly
    if (!opts?.silent) {
      addMessage({ id: assistantId, role:'assistant', content:'', timestamp:Date.now(), status:'streaming' });
    }
    // Staged build for complex apps (>=4 files). Skip for silent continuations (always one-shot).
    if (!img && !opts?.silent) {
      try {
        const handledByStaged = await runStagedBuild(userMsg, assistantId);
        if (handledByStaged) { setIsGenerating(false); return; }
      } catch (e) { console.error('staged build error, falling back', e); }
    }
    setIsGenerating(false);
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
    const history = messages.filter(m => m.status==='done').slice(-10).map(m => ({ role:m.role, content:m.content }));

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
    if (!isSelfHeal) {
      const pending = Object.values(uploadPromisesRef.current);
      if (pending.length) { try { await Promise.allSettled(pending); } catch {} }
      const af = attachedFilesRef.current;
      assets = af.filter(f => f.url).map(f => ({ name: f.name, url: f.url!, kind: f.kind }));
      attachedTextPayload = af.filter(f => f.kind === 'text' && f.text).map(f => ({ name: f.name, content: f.text! }));
      if (af.length) { setAttachedFiles([]); uploadPromisesRef.current = {}; }
    }

    try {
      const res = await fetch('/api/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: userMsg || (img ? 'Build a UI matching this screenshot exactly.' : 'Build this using the attached files.'),
          framework, fileContext, history, knowledge: knowledgeStr, modelTier,
          userId: resolvedUserId, projectId: resolvedProjectId,
          projectType, selfHeal: isSelfHeal,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
          assets: assets.length ? assets : undefined,
          attachedText: attachedTextPayload.length ? attachedTextPayload : undefined,
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
        if (steps.length > 0) setProgressSteps(steps);

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
            detail: { prompt: `Your previous output was cut off before finishing. Output the COMPLETE <file> block (full contents, not a diff) for: ${cutPath}. Then output any other files from your plan that were never emitted, each as a complete <file> block.` }
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
      // 4. Fallback: any patch that didn't match → ask AI for the full file
      if (failedPaths.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            detail: { prompt: `Some edits could not be applied automatically. Output the COMPLETE updated <file> block (full file contents, not a diff) for each of these files: ${failedPaths.join(', ')}` }
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

      // Honest-error: a truly empty stream (no text at all) means the model produced
      // nothing. The server refunds this case (`!emittedAny` → settleRefund), so tell
      // the user the truth instead of a misleading "Done." and reassure on billing.
      const emittedNothing = full.trim().length === 0;
      if (emittedNothing && newFiles.length === 0 && editBlocks.length === 0) {
        if (!opts?.silent) {
          const errMsg = "**Something went wrong** — the model returned an empty response, so nothing was changed. You weren't charged for this. Please try again.";
          updateMessage(assistantId, { content: errMsg, status: 'error' });
          persistMessage('assistant', errMsg);
        }
        return;
      }

      // Always run through cleanMessage so stored content is already scrubbed
      const finalContent = cleanMessage(chatText) || 'Done.';
      if (!opts?.silent) {
        updateMessage(assistantId, {
          content: finalContent,
          status:'done',
          filesChanged: newFiles.map(f => f.path),
        });
        persistMessage('assistant', finalContent, newFiles.map(f => f.path));
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
      if (!opts?.silent) {
        const errMsg = `**Error:** ${err instanceof Error ? err.message : 'Unknown error'}`;
        updateMessage(assistantId, { content: errMsg, status:'error' });
      }
    } finally {
      setIsGenerating(false);
      clearStreamingContent();
      setProgressSteps([]);
    }
  }, [credits, files, messages, framework, resolvedProjectId, resolvedUserId, modelTier, knowledge, addMessage, updateMessage, setIsGenerating, setStreamingContent, clearStreamingContent, consumeCredit, setFiles, setHasGeneratedFiles, saveProject, persistMessage, pushCheckpoint]);

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
  }, [pendingGenArgs, inlineSecrets, executeGeneration]);

  /**
   * Conversational lane: questions, confirmations, greetings. Hits /api/assist,
   * which deducts no credits and parses no files. If `forceChat` is false the
   * server may decide the message is actually a build/edit — in that case it
   * returns X-Assist-Intent: action and we route to executeGeneration instead.
   */
  const handleConversational = useCallback(async (userMsg: string, img: AttachedImage | null, forceChat: boolean) => {
    const hasFiles = Object.keys(files ?? {}).length > 0;
    // Echo the user's message immediately (always correct to show their own text).
    addMessage({ id: uid(), role: 'user', content: userMsg, timestamp: Date.now(), status: 'done' });
    persistMessage('user', userMsg);

    // Lightweight context: full file manifest so replies are accurate.
    const allPaths = Object.keys(files ?? {});
    const manifest = allPaths.length
      ? `EXISTING FILES:\n${allPaths.map(p => `- ${p}`).join('\n')}`
      : '';
    const history = messages.filter(m => m.status === 'done').slice(-6).map(m => ({ role: m.role, content: m.content }));

    setChatThinking(true);
    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, fileContext: manifest, history, hasFiles, forceChat }),
      });

      if (!res.ok) throw new Error(await res.text());

      // The server reclassified this as a real build/edit → hand to the build lane.
      if (res.headers.get('X-Assist-Intent') === 'action') {
        setChatThinking(false);
        await executeGeneration(userMsg, img, { echoedUser: true });
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
      addMessage({ id: uid(), role: 'assistant', content: errMsg, timestamp: Date.now(), status: 'error' });
    } finally {
      setChatThinking(false);
    }
  }, [files, messages, addMessage, updateMessage, persistMessage, executeGeneration]);

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
    if (!img && !hasAttachments) {
      const intent = classifyIntent(userMsg, !isNewBuild);
      if (intent === 'CHAT' || intent === 'AMBIGUOUS') {
        await handleConversational(userMsg, img, intent === 'CHAT');
        return;
      }
    }

    await executeGeneration(userMsg, img);
  }, [input, attachedImage, attachedFiles, isGenerating, credits, planMode, files, executeGeneration, handleConversational]);

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

      {/* No-backend storage banner — shown when files have data but no Supabase */}
      {(() => {
        if (dismissedNoPersist || isGenerating) return null
        const allContent = Object.values(files as Record<string, { content?: string }>).map(f => f?.content ?? '').join('\n')
        if (!allContent) return null
        const hasData = /useState[<(][^)]*\[\]|initialData\s*[=:]\s*\[|useState\(\[/.test(allContent)
        const hasSupabase = allContent.includes('supabase') || allContent.includes('createClient')
        if (!hasData || hasSupabase) return null
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 12px', background: 'rgba(120,53,15,0.85)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: '#fef3c7' }}>
            <span>⚠ Data is stored in browser memory only — resets on page refresh.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ color: '#fbbf24', fontWeight: 600, whiteSpace: 'nowrap' }}>Open Supabase panel → to persist</span>
              <button onClick={() => setDismissedNoPersist(true)} style={{ background: 'none', border: 'none', color: '#fef3c7', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          </div>
        )
      })()}

      {/* Plan mode pending */}
      {pendingPlan && (
        <div style={{ flexShrink:0, borderBottom:'1px solid var(--border)', overflow:'auto', maxHeight:400 }}>
          <PlanMode
            prompt={pendingPlan.prompt}
            framework={framework}
            fileContext={Object.entries(files).slice(0,10).map(([p,f]) => `<file path="${p}">\n${(f as any).content.slice(0,1500)}\n</file>`).join('\n\n')}
            projectId={projectId}
            onApprove={(planSpec) => {
              const { image } = pendingPlan;
              setPendingPlan(null);
              executeGeneration(planSpec, image);
            }}
            onCancel={() => setPendingPlan(null)}
          />
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
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ background:'var(--accent)', borderRadius:'12px 12px 3px 12px', padding:'9px 13px', fontSize:12, lineHeight:1.55, color:'#fff', maxWidth:'85%', letterSpacing:'-0.01em' }}>
                  {msg.content.startsWith('[Image:') ? (
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{opacity:0.8}}><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="5.5" cy="5.5" r="1.5"/><path d="M1 11l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {msg.content.split('\n')[0].replace('[Image: ','').replace(']','')}
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, lineHeight:1.65, color: msg.status === 'error' ? 'var(--ide-red)' : 'var(--ide-text2)', letterSpacing:'-0.01em' }}>
                    {msg.status === 'streaming'
                      ? <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
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
                                {buildMsg} {elapsed > 0 && `(${elapsed}s)`}
                              </span>
                          }
                        </div>
                      : renderMessage(msg.content)
                    }
                  </div>
                  {msg.filesChanged && msg.filesChanged.length > 0 && (
                    <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:3 }}>
                      {msg.filesChanged.map(f => (
                        <span key={f} style={{ background:'var(--accent-glow)', color:'var(--accent)', padding:'1px 6px', borderRadius:4, fontSize:10, border:'1px solid var(--accent-dim)', fontFamily:'monospace' }}>✎ {f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && progressSteps.length === 0 && (
          <div style={{ padding:'4px 12px' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:5, fontSize:12, color:'var(--ide-text3)' }}>
                <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                {buildMsg} {elapsed > 0 && `(${elapsed}s)`}
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
                Thinking…
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
                : <span style={{ fontSize:18, flexShrink:0 }}>{f.kind === 'image' ? '🖼' : f.kind === 'text' ? '📄' : '📎'}</span>}
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{f.uploading ? 'Uploading…' : f.kind === 'image' ? 'Image' : f.kind === 'text' ? 'Doc · text read' : 'Attached'}</div>
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
          {!input && !isGenerating && !pendingGenArgs && !pendingPlan && credits > 0 && messages.length > 0 && (
            <div style={{ display: 'flex', gap: 4, padding: '6px 10px 0', flexWrap: 'wrap' }}>
              {(Object.keys(files).length > 2 || hasGeneratedFiles
                ? [
                    { label: 'Add dark mode', prompt: 'Add a dark/light mode toggle with persistent theme. Use CSS variables for all colors.' },
                    { label: 'Connect Supabase', prompt: 'Connect Supabase for real auth and database. Replace all mock data with live queries.' },
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
            disabled={isGenerating || !!pendingPlan || !!pendingGenArgs}
            rows={1}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', resize:'none', padding:'10px 12px 6px', fontFamily:'var(--font-sans)', fontSize:12, color:'var(--ide-text)', lineHeight:1.55, minHeight:40, maxHeight:140, overflowY:'auto', letterSpacing:'-0.01em' }}
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
              onClick={handleSend}
              data-send-button="true"
              disabled={(!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating || !!pendingPlan || !!pendingGenArgs}
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', flexShrink: 0,
                background: (!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating ? 'var(--bg-overlay)' : 'var(--accent)',
                color: (!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating ? 'var(--ide-text3)' : 'white',
                cursor: (!input.trim() && !attachedImage && attachedFiles.length === 0) || isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
              }}
            >
              {isGenerating
                ? <div style={{ width:11, height:11, border:'1.5px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
