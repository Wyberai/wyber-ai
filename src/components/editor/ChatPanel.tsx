'use client'
import { CreditEstimateBar } from '@/components/shared/CreditEstimateBar'
import { VoiceButton } from './VoiceButton';
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback } from 'react';
import { parseGenerationOutput } from '@/lib/file-parser';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';
import { PlanMode } from './PlanMode';

function uid() { return Math.random().toString(36).slice(2, 9); }

function cleanMessage(text: string): string {
  // Strip all code — only show conversational text in chat
  let t = text;
  // Remove file blocks
  t = t.replace(/<file[^\s>]*[^>]*>[\s\S]*?<\/file>/gi, '');
  // Remove code fences
  t = t.replace(/```[\s\S]*?```/g, '');
  // Remove inline code that looks like code paths
  t = t.replace(/`src\/[^`]+`/g, '');
  // Split and filter lines
  const lines = t.split('\n').map(l => l.trim()).filter(l => {
    if (!l) return false;
    // Filter out code-like lines
    if (l.startsWith('✎')) return false;
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
    // Filter out data object lines (TypeScript object literals)
    if (l.startsWith('{ id:') || l.startsWith('id:') || l.startsWith('name:')) return false;
    if (l.match(/^[a-z]+: ['\"\[{]/)) return false; // property: value lines
    return true;
  });
  // Keep only the summary line (usually last non-empty line after "Built:")
  const builtLine = lines.find(l => l.startsWith('Built:'));
  if (builtLine) return builtLine;
  return lines.join('\n').trim();
}

function renderMessage(text: string) {
  const cleaned = cleanMessage(text);
  const parts = cleaned.split(/(```edited:[^`]+```|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```edited:')) {
      return null; // Never show file edit badges in chat
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background:'var(--bg-overlay)', padding:'1px 5px', borderRadius:3, fontFamily:'monospace', fontSize:11 }}>{part.slice(1,-1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

interface AttachedImage { dataUrl: string; base64: string; mimeType: string; name: string; }
interface Props { projectId?: string; userId?: string; }

type ModelTier = 'fast' | 'default' | 'premium';
const MODEL_LABELS: Record<ModelTier, { label: string; credits: string; description: string }> = {
  fast:    { label: 'Fast',    credits: '1 credit',  description: 'Quick edits and simple changes' },
  default: { label: 'Standard', credits: '1 credit', description: 'Best for most tasks' },
  premium: { label: 'Premium', credits: '2 credits', description: 'Complex apps and detailed UI' },
};

export function ChatPanel({ projectId, userId }: Props) {
  const {
    messages, isGenerating, addMessage, updateMessage,
    setIsGenerating, setStreamingContent, appendStreamingContent, clearStreamingContent,
    setFiles, files, framework, consumeCredit, credits, setPreviewUrl, setHasGeneratedFiles,
    project,
  } = useEditorStore();
  
  // Always get projectId from store — props are unreliable when RightPanel doesn't pass them
  const resolvedProjectId = projectId || project?.id;
  const resolvedUserId = userId || project?.userId;

  const [input, setInput] = useState('');
  const [buildMsgIdx, setBuildMsgIdx] = useState(0);
  const BUILD_MSGS = ['Building your app...', 'Writing clean code...', 'Crafting every component...', 'Making it beautiful...', 'Almost there...', 'Putting on the finishing touches...', 'Just a few more lines...'];
  useEffect(() => {
    if (!isGenerating) { setBuildMsgIdx(0); return; }
    const t = setInterval(() => setBuildMsgIdx(i => (i + 1) % BUILD_MSGS.length), 2000);
    return () => clearInterval(t);
  }, [isGenerating]);
  const buildMsg = BUILD_MSGS[buildMsgIdx];
  const [hasInit, setHasInit] = useState(false);
  const [isSandboxing, setIsSandboxing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [modelTier, setModelTier] = useState<ModelTier>('default');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ prompt: string; image: AttachedImage | null } | null>(null);
  const [lastCreditCost, setLastCreditCost] = useState<number | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);


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

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const initProject = useCallback(() => {
    if (hasInit) return; // Only run once
    setHasInit(true);
    const template = STARTER_TEMPLATES[framework];
    setFiles(template);
    addMessage({ id: uid(), role:'assistant', content:`**Wyber AI ready** — describe what to build, paste a screenshot, or pick a template.`, timestamp:Date.now(), status:'done' });
  }, [hasInit, framework, setFiles, addMessage]); // files excluded — prevents infinite loop

  useEffect(() => { initProject(); }, [initProject]);

  // Auto-trigger generation if a prompt was passed from dashboard/homepage
  useEffect(() => {
    if (!resolvedProjectId || !hasInit) return;
    const key = `wyber_prompt_${resolvedProjectId}`;
    const savedPrompt = sessionStorage.getItem(key);
    if (!savedPrompt) return;
    sessionStorage.removeItem(key); // clear so it doesn't re-trigger
    // Small delay to ensure files/state are ready
    const timer = setTimeout(() => {
      setInput(savedPrompt);
      // Use a ref-based approach to trigger send
      const event = new CustomEvent('wyber_auto_generate', { detail: { prompt: savedPrompt } });
      window.dispatchEvent(event);
    }, 800);
    return () => clearTimeout(timer);
  }, [resolvedProjectId, hasInit]);

  // Listen for auto-generate event
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { prompt } = e.detail;
      if (!prompt) return;
      setInput(prompt);
      // Trigger send after state update
      setTimeout(() => {
        const btn = document.querySelector('[data-send-button]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 100);
    };
    window.addEventListener('wyber_auto_generate', handler as EventListener);

    // Also listen for wyber-autofix (from AutoFix component, VisualEditor, PreviewPanel)
    const autofixHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.prompt) return
      setInput(detail.prompt)
      setTimeout(() => {
        const btn = document.querySelector('[data-send-button]') as HTMLButtonElement
        if (btn && !btn.disabled) btn.click()
      }, 100)
    }
    window.addEventListener('wyber-autofix', autofixHandler)
    return () => {
      window.removeEventListener('wyber_auto_generate', handler as EventListener)
      window.removeEventListener('wyber-autofix', autofixHandler)
    }
  }, []);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAttachedImage({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (imageItem) { const file = imageItem.getAsFile(); if (file) { e.preventDefault(); handleImageFile(file); } }
  }, [handleImageFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const launchSandbox = useCallback((_updatedFiles: typeof files) => {
    // Sandpack reads files directly from store - nothing to do here
    setIsSandboxing(false);
  }, []);

  const saveProject = useCallback(async (updatedFiles: typeof files) => {
    if (!resolvedProjectId) return;
    fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ projectId: resolvedProjectId, files: updatedFiles, userId: resolvedUserId || "auto" }) }).catch(() => {});
  }, [resolvedProjectId]);

  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null) => {
    consumeCredit(); // Optimistic local update — will be corrected after generation
    addMessage({ id: uid(), role:'user', content: img ? `[Image: ${img.name}]\n${userMsg || 'Build a UI matching this screenshot'}` : userMsg, timestamp:Date.now(), status:'done' });
    const assistantId = uid();
    addMessage({ id: assistantId, role:'assistant', content:'', timestamp:Date.now(), status:'streaming' });
    setIsGenerating(false); // Will be set true only when files start streaming
    clearStreamingContent();
    setLastCreditCost(null);
    setLastModel(null);

    // Smart file context — prioritize core files and recently changed ones
    const promptLower = (userMsg || '').toLowerCase();
    const CORE_FILES = ['app.tsx', 'app.vue', 'index.html', 'index.css', 'app.css', 'main.tsx'];
    const allFileEntries = Object.entries(files);
    const scored = allFileEntries.map(([path, f]) => {
      const pathLower = path.toLowerCase();
      let score = CORE_FILES.some(c => pathLower.endsWith(c)) ? 100 : 0;
      promptLower.split(/\s+/).filter(w => w.length > 3).forEach(w => { if (pathLower.includes(w)) score += 20; });
      return { path, content: (f as any).content, score };
    });
    const topFiles = scored.sort((a,b) => b.score - a.score).slice(0, 10);
    const fileContext = topFiles.map(({path, content}) => `<file path="${path}">\n${content.slice(0,2000)}\n</file>`).join('\n\n');
    const history = messages.filter(m => m.status==='done').slice(-6).map(m => ({ role:m.role, content:m.content }));

    let knowledge = '';
    try {
      const k = localStorage.getItem('wyber_knowledge');
      if (k) {
        const obj = JSON.parse(k);
        knowledge = Object.entries(obj).filter(([,v]) => (v as string).trim()).map(([key,val]) => `${key}: ${val}`).join('\n');
        if (knowledge) knowledge = `\n\nCUSTOM PROJECT KNOWLEDGE:\n${knowledge}`;
      }
    } catch {}

    try {
      const endpoint = modelTier === 'agent' ? '/api/agent' : '/api/generate';
      const res = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: userMsg || 'Build a UI matching this screenshot exactly.',
          framework, fileContext, history, resolvedProjectId, knowledge, modelTier, resolvedUserId,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Read source and cost from headers
      const xSource = res.headers.get('X-Source'); // 'prebuilt' = 0 credits
      const creditsUsed = res.headers.get('X-Credits-Used');
      const modelUsed = res.headers.get('X-Model-Used');
      if (creditsUsed) setLastCreditCost(parseInt(creditsUsed));
      if (modelUsed) setLastModel(modelUsed);

      // Deduct credits AFTER we know what was used
      // Prebuilt apps cost 0 credits — refund the optimistic deduction
      const isPrebuilt = xSource === 'prebuilt';
      const creditAmount = isPrebuilt ? 0 : (modelTier === 'premium' ? 2 : 1);
      
      if (isPrebuilt) {
        // Refund optimistic deduction — prebuilts are free
        useEditorStore.getState().setCredits(credits + 1);
      } else {
        // Persist real deduction to Supabase
        fetch('/api/credits/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: creditAmount, reason: 'generation' }),
        }).then(r => r.json()).then(data => {
          if (data.credits !== undefined) {
            useEditorStore.getState().setCredits(data.credits);
          }
        }).catch(() => {});
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      // Don't stream code to chat — buffer everything, show clean summary at end
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream:true });
        // Only stream conversational lines (questions, clarifications) — not code
        // A line is safe if it has no code markers at all
        const lastLine = full.split('\n').pop() ?? '';
        const isSafeChat = (t: string) => {
          t = t.trim();
          if (!t || t.length < 3) return false;
          if (t.startsWith('<') || t.startsWith('{') || t.startsWith('/')) return false;
          if (t.includes('<file') || t.includes('className') || t.includes('=>')) return false;
          if (/^(import|export|const|let|var|function|return|interface|type)\s/.test(t)) return false;
          if (t.startsWith('Built:') || t.startsWith('Perfect') || t.startsWith('Got it') || t.startsWith('Sure') || t.startsWith('Here') || t.startsWith('I') || t.startsWith('Let') || t.endsWith('?')) return true;
          return false;
        };
        if (isSafeChat(lastLine)) setStreamingContent(lastLine);
        // Don't show raw file blocks in chat — show only the summary line
// Strip file blocks and file edit lines — only show the summary
const lines = full.split('\n');
const filteredLines = lines.filter(l => {
  const t = l.trim();
  return !t.startsWith('<file ') && !t.startsWith('</file>') && !t.startsWith('✎') && !t.startsWith('📝');
});
// Strip agent/flow blocks from display
let cleanedFull = full
  .replace(/<agent>[\s\S]*?<\/agent>/g, '')
  .replace(/<flow>[\s\S]*?<\/flow>/g, '')

// Strip file blocks AND code lines from final content
const isCodeLine = (l: string) => {
  const t = l.trim();
  if (!t) return false;
  if (t.startsWith('<file ') || t.startsWith('</file>') || t.startsWith('✎') || t.startsWith('📝')) return true;
  if (/^(import |export |export default|const |let |var |function |async |class |interface |type |return |throw )/.test(t)) return true;
  if (t.startsWith('<') && t.includes('>') && (t.includes('className') || t.includes('style=') || t.includes('onClick') || t.includes('/>') || t.includes('</') || /^<[A-Z]/.test(t))) return true;
  if (t.startsWith('</') || t.startsWith('/>') || t === '};' || t === '})' || t === ');') return true;
  if (t.includes('className=') || t.includes('style={{') || t.includes('useState') || t.includes('useEffect')) return true;
  return false;
};
let inFileBlock = false;
const chatLines = filteredLines.filter(l => {
  if (l.trim().startsWith('<file ')) { inFileBlock = true; return false; }
  if (l.trim().startsWith('</file>')) { inFileBlock = false; return false; }
  if (inFileBlock) return false;
  return !isCodeLine(l);
});
const chatContent = chatLines.join('\n').trim();
setStreamingContent(chatContent || '');
      }

      const { files: newFiles, chatText } = parseGenerationOutput(full);
      let updatedFiles = { ...files };
      if (newFiles.length > 0) {
        for (const { path, content } of newFiles) {
          const ext = path.split('.').pop() ?? '';
          const langMap: Record<string,string> = { ts:'typescript', tsx:'typescript', js:'javascript', jsx:'javascript', css:'css', html:'html', json:'json', vue:'vue' };
          updatedFiles[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
        }
        setFiles(updatedFiles);
        setHasGeneratedFiles(true);
        await saveProject(updatedFiles);
        launchSandbox(updatedFiles); // fire and forget -- preview loads async
      }

      updateMessage(assistantId, {
        content: chatText || 'Done.',
        status:'done',
        filesChanged: newFiles.map(f => f.path),
      });

    } catch (err: unknown) {
      updateMessage(assistantId, { content:`**Error:** ${err instanceof Error ? err.message : 'Unknown error'}`, status:'error' });
    } finally {
      setIsGenerating(false);
      clearStreamingContent();
    }
  }, [credits, files, messages, framework, resolvedProjectId, modelTier, addMessage, updateMessage, setIsGenerating, setStreamingContent, appendStreamingContent, clearStreamingContent, consumeCredit, setFiles, saveProject, launchSandbox]);

  // Extract imports from a file's content
  const extractFileImports = (code: string): string[] => {
    const imports: string[] = [];
    const re = /from ['"](\.[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const p = m[1];
      if (!p.endsWith('.css') && !p.endsWith('.svg') && !p.endsWith('.png') && !p.endsWith('.jpg')) {
        imports.push(p);
      }
    }
    return imports;
  };

  // Resolve import path relative to a source file
  const resolveRelative = (fromFile: string, importPath: string): string => {
    const fromParts = fromFile.split('/').slice(0, -1);
    const importParts = importPath.split('/');
    for (const part of importParts) {
      if (part === '..') fromParts.pop();
      else if (part !== '.') fromParts.push(part);
    }
    return fromParts.join('/');
  };

  // After generation: find missing imports and auto-generate them
  const autoRepairMissingFiles = useCallback(async (currentFiles: Record<string, { content: string; path: string; language: string }>) => {
    const allPaths = new Set(Object.keys(currentFiles));
    const missing: string[] = [];

    for (const [filePath, file] of Object.entries(currentFiles)) {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx') && !filePath.endsWith('.ts')) continue;
      if ((file.content?.length ?? 0) < 50) continue; // skip stubs

      const imports = extractFileImports(file.content ?? '');
      for (const imp of imports) {
        const resolved = resolveRelative(filePath, imp);
        const candidates = [resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '/index.tsx'];
        const exists = candidates.some(c => allPaths.has(c) || allPaths.has('/' + c));
        if (!exists && !resolved.includes('node_modules')) {
          const missingPath = resolved + '.tsx';
          if (!missing.includes(missingPath)) missing.push(missingPath);
        }
      }
    }

    if (missing.length === 0) return;

    // Auto-generate missing files
    const missingList = missing.join(', ');
    const repairPrompt = `The following files were imported but not generated. Generate ONLY these missing files, nothing else: ${missingList}. Each should be a complete, styled component matching the existing design system.`;

    addMessage({ id: Date.now().toString(), role: 'assistant', content: '⚡ Auto-generating ' + missing.length + ' missing file' + (missing.length > 1 ? 's' : '') + ': ' + missingList, timestamp: Date.now(), status: 'done' });

    try {
      const topFiles = Object.entries(currentFiles)
        .filter(([, f]) => (f.content?.length ?? 0) > 100)
        .slice(0, 5)
        .slice(0, 5)
        .map(([p, f]) => '<file path="' + p + '">' + (f.content ?? '').slice(0, 1500) + '</file>')
        .join('\n\n');




      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: repairPrompt,
          framework,
          fileContext: topFiles,
          history: [],
          resolvedUserId,
          modelTier: 'fast',
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }

      const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
      let match;
      const newFiles = { ...currentFiles };
      while ((match = fileRegex.exec(raw)) !== null) {
        const [, path, fileContent] = match;
        const cleanContent = fileContent.replace(/^\n/, '').replace(/\n$/, '');
        if (cleanContent.length > 50) {
          newFiles[path] = { path, content: cleanContent, language: path.endsWith('.css') ? 'css' : 'typescript' };
        }
      }

      if (Object.keys(newFiles).length > Object.keys(currentFiles).length) {
        setFiles(newFiles);
        addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: '✓ Missing files generated. Preview updated.', timestamp: Date.now(), status: 'done' });
      }
    } catch (err) {
      console.error('Auto-repair failed:', err);
    }
  }, [framework, resolvedUserId, addMessage, setFiles]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedImage) || isGenerating || credits <= 0) return;
    const userMsg = input.trim();
    const img = attachedImage;
    setInput('');
    setAttachedImage(null);

    if (planMode) {
      setPendingPlan({ prompt: userMsg, image: img });
    } else {
      await executeGeneration(userMsg, img);
    }
  }, [input, attachedImage, isGenerating, credits, planMode, executeGeneration]);

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
          <span style={{ fontSize:12, fontWeight:600, color:'var(--ide-text)', letterSpacing:'-0.02em' }}>Wyber AI</span>
          {lastModel && lastCreditCost && (
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'var(--bg-overlay)', color:'var(--ide-text3)', border:'1px solid var(--ide-border)' }}>
              {lastCreditCost}cr
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {isSandboxing && (
            <span style={{ fontSize:10, color:'var(--ide-amber)', display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--ide-amber)', animation:'pulse 1s ease-in-out infinite' }} />
              Sandboxing...
            </span>
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

      {/* Plan mode pending */}
      {pendingPlan && (
        <div style={{ flexShrink:0, borderBottom:'1px solid var(--border)', overflow:'auto', maxHeight:400 }}>
          <PlanMode
            prompt={pendingPlan.prompt}
            framework={framework}
            fileContext={Object.entries(files).slice(0,10).map(([p,f]) => `<file path="${p}">\n${f.content.slice(0,1500)}\n</file>`).join('\n\n')}
            onApprove={() => {
              const { prompt, image } = pendingPlan;
              setPendingPlan(null);
              executeGeneration(prompt, image);
            }}
            onCancel={() => setPendingPlan(null)}
          />
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(124,110,247,0.1)', border:'2px dashed var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, pointerEvents:'none' }}>
          <span style={{ fontSize:14, color:'var(--accent)', fontWeight:500 }}>Drop image to generate UI</span>
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
                      ? <span style={{ display:'flex', alignItems:'center', gap:7, color:'var(--ide-text3)' }}>
                          <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
                          {buildMsg}
                        </span>
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

        {isGenerating && (
          <div style={{ padding:'4px 12px' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="11" height="11" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, paddingTop:5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--ide-text3)', animation:`dot-pulse 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached image */}
      {attachedImage && (
        <div style={{ margin:'0 12px', padding:'8px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--accent-dim)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <img src={attachedImage.dataUrl} alt="attached" style={{ width:48, height:48, objectFit:'cover', borderRadius:5 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>🖼 {attachedImage.name}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Image attached — describe changes or just hit Generate</div>
          </div>
          <button onClick={() => setAttachedImage(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}>×</button>
        </div>
      )}

      {/* Model picker dropdown */}
      {showModelPicker && (
        <div style={{ position:'absolute', bottom:80, right:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:8, zIndex:100, minWidth:220, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          {(Object.keys(MODEL_LABELS) as ModelTier[]).map(tier => (
            <button key={tier} onClick={() => { setModelTier(tier); setShowModelPicker(false); }}
              style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:7, border:'none', background: modelTier === tier ? 'var(--accent-glow)' : 'transparent', cursor:'pointer', marginBottom:2 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color: modelTier === tier ? 'var(--accent)' : 'var(--text-primary)', fontWeight:500 }}>{MODEL_LABELS[tier].label}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{MODEL_LABELS[tier].credits}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{MODEL_LABELS[tier].description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:'8px 10px', borderTop:'1px solid var(--ide-border)', background:'var(--bg-base)', flexShrink:0 }}>
        <div style={{ background:'var(--bg-elevated)', borderRadius:10, border:`1px solid ${input.trim() ? 'var(--ide-border-light)' : 'var(--ide-border)'}`, overflow:'hidden', transition:'border-color 0.15s', display:'flex', flexDirection:'column' }}>
          <textarea
            ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={credits <= 0 ? 'No credits — upgrade to continue' : planMode ? 'Plan mode active — describe what to build...' : 'Ask anything or describe what you want to build...'}
            disabled={isGenerating || credits <= 0 || !!pendingPlan}
            rows={1}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', resize:'none', padding:'10px 12px 6px', fontFamily:'var(--font-sans)', fontSize:12, color:'var(--ide-text)', lineHeight:1.55, minHeight:40, maxHeight:140, overflowY:'auto', letterSpacing:'-0.01em' }}
          />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px 7px', gap: 6 }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', flex: 1 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value=''; }} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach image"
                style={{ background:'none', border:'none', color:'var(--ide-text3)', cursor:'pointer', padding:'3px 5px', borderRadius:5, transition:'var(--t)', display:'flex', alignItems:'center' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text3)'}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><circle cx="5.5" cy="5.5" r="1.5"/><path d="M1 11l4-4 3 3 2-2 5 5"/></svg>
              </button>
              <button onClick={recording ? stopRecording : startRecording} title={recording ? 'Stop recording' : 'Voice input'}
                style={{ background: recording ? 'rgba(239,68,68,0.1)' : 'none', border:'none', color: recording ? 'var(--ide-red)' : 'var(--ide-text3)', cursor:'pointer', padding:'3px 5px', borderRadius:5, transition:'var(--t)', display:'flex', alignItems:'center' }}
                onMouseEnter={e => { if (!recording) (e.currentTarget as HTMLElement).style.color = 'var(--ide-text2)'; }}
                onMouseLeave={e => { if (!recording) (e.currentTarget as HTMLElement).style.color = 'var(--ide-text3)'; }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="1" width="6" height="9" rx="3"/><path d="M1 8a7 7 0 0014 0M8 15v-2"/></svg>
              </button>
              <button
                onClick={() => setShowModelPicker(v => !v)}
                style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--ide-border)', background: showModelPicker ? 'var(--bg-overlay)' : 'transparent', color:'var(--ide-text3)', cursor:'pointer', fontFamily:'var(--font-sans)', transition:'var(--t)', letterSpacing:'-0.01em' }}
              >
                {MODEL_LABELS[modelTier].label} ▾
              </button>
            </div>

            {/* Send button — right side, inside toolbar row */}
            <button
              onClick={handleSend}
              data-send-button="true"
              disabled={(!input.trim() && !attachedImage) || isGenerating || credits <= 0 || !!pendingPlan}
              style={{
                width: 30, height: 30,
                borderRadius: 8,
                border: 'none',
                flexShrink: 0,
                background: (!input.trim() && !attachedImage) || isGenerating || credits <= 0
                  ? 'var(--bg-overlay)' : 'var(--accent)',
                color: (!input.trim() && !attachedImage) || isGenerating || credits <= 0
                  ? 'var(--ide-text3)' : 'white',
                cursor: (!input.trim() && !attachedImage) || isGenerating || credits <= 0
                  ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
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
