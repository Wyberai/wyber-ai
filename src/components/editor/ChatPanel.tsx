'use client';
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback } from 'react';
import { parseGenerationOutput } from '@/lib/file-parser';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';
import { PlanMode } from './PlanMode';

function uid() { return Math.random().toString(36).slice(2, 9); }

function renderMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background:'var(--bg-overlay)', padding:'1px 5px', borderRadius:3, fontFamily:'monospace', fontSize:11 }}>{part.slice(1,-1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

interface AttachedImage { dataUrl: string; base64: string; mimeType: string; name: string; }
interface Props { projectId?: string; }

type ModelTier = 'fast' | 'default' | 'premium';
const MODEL_LABELS: Record<ModelTier, { label: string; credits: string; description: string }> = {
  fast:    { label: 'Fast',     credits: '1 credit',  description: 'Quick edits and simple changes' },
  default: { label: 'Standard', credits: '1 credit',  description: 'Best for most tasks' },
  premium: { label: 'Premium',  credits: '2 credits', description: 'Complex apps and detailed UI' },
};

export function ChatPanel({ projectId }: Props) {
  const {
    messages, isGenerating, addMessage, updateMessage,
    setIsGenerating, setStreamingContent, appendStreamingContent, clearStreamingContent,
    setFiles, files, framework, consumeCredit, credits, setPreviewUrl,
  } = useEditorStore();

  const [input, setInput] = useState('');
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const initProject = useCallback(() => {
    if (hasInit || Object.keys(files).length > 0) { setHasInit(true); return; }
    setHasInit(true);
    setFiles(STARTER_TEMPLATES[framework]);
    addMessage({ id: uid(), role: 'assistant', content: '**Wyber AI ready** — describe what to build, paste a screenshot, or pick a template.', timestamp: Date.now(), status: 'done' });
  }, [hasInit, framework, files, setFiles, addMessage]);

  useEffect(() => { initProject(); }, [initProject]);

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

  const launchSandbox = useCallback(async (updatedFiles: typeof files) => {
    setIsSandboxing(true);
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId ?? 'local', files: updatedFiles, framework }),
      });
      const data = await res.json();
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
    } catch {}
    setIsSandboxing(false);
  }, [projectId, framework, setPreviewUrl]);

  const saveProject = useCallback(async (updatedFiles: typeof files) => {
    if (!projectId) return;
    fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, files: updatedFiles, userId: 'auto' }),
    }).catch(() => {});
  }, [projectId]);

  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null) => {
    consumeCredit();
    addMessage({ id: uid(), role: 'user', content: img ? `[Image: ${img.name}]\n${userMsg || 'Build a UI matching this screenshot'}` : userMsg, timestamp: Date.now(), status: 'done' });
    const assistantId = uid();
    addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });
    setIsGenerating(true);
    clearStreamingContent();
    setLastCreditCost(null);
    setLastModel(null);

    const fileContext = Object.entries(files).slice(0, 20).map(([path, f]) => `<file path="${path}">\n${f.content.slice(0, 3000)}\n</file>`).join('\n\n');
    const history = messages.filter(m => m.status === 'done').slice(-6).map(m => ({ role: m.role, content: m.content }));

    let knowledge = '';
    try {
      const k = localStorage.getItem('wyber_knowledge');
      if (k) {
        const obj = JSON.parse(k);
        knowledge = Object.entries(obj).filter(([, v]) => (v as string).trim()).map(([key, val]) => `${key}: ${val}`).join('\n');
        if (knowledge) knowledge = `\n\nCUSTOM PROJECT KNOWLEDGE:\n${knowledge}`;
      }
    } catch {}

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg || 'Build a UI matching this screenshot exactly.',
          framework, fileContext, history, projectId, knowledge, modelTier,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const creditsUsed = res.headers.get('X-Credits-Used');
      const modelUsed = res.headers.get('X-Model-Used');
      if (creditsUsed) setLastCreditCost(parseInt(creditsUsed));
      if (modelUsed) setLastModel(modelUsed);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        appendStreamingContent(chunk);
        setStreamingContent(full);
      }

      const { files: newFiles, chatText } = parseGenerationOutput(full);
      const updatedFiles = { ...files };
      if (newFiles.length > 0) {
        for (const { path, content } of newFiles) {
          const ext = path.split('.').pop() ?? '';
          const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json', vue: 'vue' };
          updatedFiles[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
        }
        setFiles(updatedFiles);
        await saveProject(updatedFiles);
        await launchSandbox(updatedFiles);
      }

      updateMessage(assistantId, {
        content: chatText || 'Done.',
        status: 'done',
        filesChanged: newFiles.map(f => f.path),
      });

    } catch (err: unknown) {
      updateMessage(assistantId, { content: `**Error:** ${err instanceof Error ? err.message : 'Unknown error'}`, status: 'error' });
    } finally {
      setIsGenerating(false);
      clearStreamingContent();
    }
  }, [credits, files, messages, framework, projectId, modelTier, addMessage, updateMessage, setIsGenerating, setStreamingContent, appendStreamingContent, clearStreamingContent, consumeCredit, setFiles, saveProject, launchSandbox]);

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
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', position: 'relative' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{ padding: '0 14px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>⚡ Wyber AI</span>
          {lastModel && lastCreditCost && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {lastModel} · {lastCreditCost} credit
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSandboxing && <span style={{ fontSize: 10, color: 'var(--amber)' }}>⟳ starting preview…</span>}
          <button
            onClick={() => setPlanMode(v => !v)}
            title="Plan Mode — preview steps before generating"
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: `1px solid ${planMode ? 'var(--accent-dim)' : 'var(--border)'}`, background: planMode ? 'var(--accent-glow)' : 'transparent', color: planMode ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}
          >
            ◎ Plan
          </button>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: credits > 20 ? 'var(--green-dim)' : 'rgba(240,82,82,0.15)', color: credits > 20 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
            {credits} credits
          </span>
        </div>
      </div>

      {/* Plan mode */}
      {pendingPlan && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', overflow: 'auto', maxHeight: 400 }}>
          <PlanMode
            prompt={pendingPlan.prompt}
            framework={framework}
            fileContext={Object.entries(files).slice(0, 10).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0, 1500)}\n</file>`).join('\n\n')}
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
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.1)', border: '2px dashed var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
          <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500 }}>Drop image to generate UI</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ padding: '8px 16px', marginBottom: 2 }}>
            {msg.role === 'user' ? (
              <div style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                {msg.content.startsWith('[Image:')
                  ? <div style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>🖼 {msg.content.split('\n')[0]}</div>
                  : msg.content}
              </div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>WYBER</span>
                  {msg.status === 'error' && <span style={{ fontSize: 10, color: 'var(--red)' }}>error</span>}
                </div>
                <div style={{ color: msg.status === 'error' ? 'var(--red)' : 'var(--text-secondary)' }}>
                  {renderMessage(msg.content)}
                </div>
                {msg.filesChanged && msg.filesChanged.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {msg.filesChanged.map(f => (
                      <span key={f} style={{ background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 7px', borderRadius: 4, fontSize: 11, border: '1px solid var(--accent-dim)', fontFamily: 'monospace' }}>✎ {f}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }} />)}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Building your app...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached image */}
      {attachedImage && (
        <div style={{ margin: '0 12px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--accent-dim)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <img src={attachedImage.dataUrl} alt="attached" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>🖼 {attachedImage.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Image attached — describe changes or just hit Generate</div>
          </div>
          <button onClick={() => setAttachedImage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Model picker */}
      {showModelPicker && (
        <div style={{ position: 'absolute', bottom: 80, right: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, zIndex: 100, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {(Object.keys(MODEL_LABELS) as ModelTier[]).map(tier => (
            <button key={tier} onClick={() => { setModelTier(tier); setShowModelPicker(false); }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 7, border: 'none', background: modelTier === tier ? 'var(--accent-glow)' : 'transparent', cursor: 'pointer', marginBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: modelTier === tier ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 500 }}>{MODEL_LABELS[tier].label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{MODEL_LABELS[tier].credits}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{MODEL_LABELS[tier].description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <textarea
            ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={credits <= 0 ? 'No credits — upgrade to continue' : planMode ? 'Describe what to build — Plan Mode will preview steps first...' : 'Describe what to build, or paste/drop a screenshot...'}
            disabled={isGenerating || credits <= 0 || !!pendingPlan}
            rows={1}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, minHeight: 44, maxHeight: 160, overflowY: 'auto' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach screenshot" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>🖼</button>
              <button onClick={() => setShowModelPicker(v => !v)}
                style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {MODEL_LABELS[modelTier].label} ▾
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>↵ Send</span>
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedImage) || isGenerating || credits <= 0 || !!pendingPlan}
              className="btn btn-primary"
              style={{ padding: '5px 14px', fontSize: 12 }}
            >
              {isGenerating ? '⟳ Building...' : planMode ? '◎ Plan ⚡' : attachedImage ? '🖼 Generate ⚡' : 'Generate ⚡'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(0.7);opacity:0.4}50%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}