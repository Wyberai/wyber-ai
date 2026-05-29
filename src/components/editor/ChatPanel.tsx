'use client';
import { useEditorStore } from '@/store/editor';
import { useRef, useEffect, useState, useCallback } from 'react';
import { parseGenerationOutput } from '@/lib/file-parser';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';
import { PlanMode } from './PlanMode';

function uid() { return Math.random().toString(36).slice(2, 9); }

function renderMessage(text: string) {
  const parts = text.split(/(```edited:[^`]+```|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```edited:')) {
      const path = part.replace('```edited:', '').replace('```', '').trim();
      return <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--accent-glow)', border:'1px solid var(--accent-dim)', borderRadius:4, padding:'1px 7px', fontSize:11, color:'var(--accent)', margin:'0 2px', fontFamily:'monospace' }}>✎ {path}</span>;
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
    if (hasInit || Object.keys(files).length > 0) { setHasInit(true); return; }
    setHasInit(true);
    const template = STARTER_TEMPLATES[framework];
    setFiles(template);
    addMessage({ id: uid(), role:'assistant', content:`**Wyber AI ready** — describe what to build, paste a screenshot, or pick a template.`, timestamp:Date.now(), status:'done' });
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
      const res = await fetch('/api/sandbox', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ projectId: projectId ?? 'local', files: updatedFiles, framework }) });
      const data = await res.json();
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
    } catch {}
    setIsSandboxing(false);
  }, [projectId, framework, setPreviewUrl]);

  const saveProject = useCallback(async (updatedFiles: typeof files) => {
    if (!projectId) return;
    fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ projectId, files: updatedFiles, userId:'auto' }) }).catch(() => {});
  }, [projectId]);

  const executeGeneration = useCallback(async (userMsg: string, img: AttachedImage | null) => {
    consumeCredit();
    addMessage({ id: uid(), role:'user', content: img ? `[Image: ${img.name}]\n${userMsg || 'Build a UI matching this screenshot'}` : userMsg, timestamp:Date.now(), status:'done' });
    const assistantId = uid();
    addMessage({ id: assistantId, role:'assistant', content:'', timestamp:Date.now(), status:'streaming' });
    setIsGenerating(true);
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
      const res = await fetch('/api/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: userMsg || 'Build a UI matching this screenshot exactly.',
          framework, fileContext, history, projectId, knowledge, modelTier, userId,
          image: img ? { base64: img.base64, mimeType: img.mimeType } : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Read credit cost from headers
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
        const chunk = decoder.decode(value, { stream:true });
        full += chunk;
        appendStreamingContent(chunk);
        setStreamingContent(full);
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
                    {renderMessage(msg.content)}
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
        <div style={{ background:'var(--bg-elevated)', borderRadius:10, border:`1px solid ${input.trim() ? 'var(--ide-border-light)' : 'var(--ide-border)'}`, overflow:'hidden', transition:'border-color 0.15s' }}>
          <textarea
            ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={credits <= 0 ? 'No credits — upgrade to continue' : planMode ? 'Describe what to build (Plan Mode on)...' : 'Describe what to build...'}
            disabled={isGenerating || credits <= 0 || !!pendingPlan}
            rows={1}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', resize:'none', padding:'10px 12px 6px', fontFamily:'var(--font-sans)', fontSize:12, color:'var(--ide-text)', lineHeight:1.55, minHeight:40, maxHeight:140, overflowY:'auto', letterSpacing:'-0.01em' }}
          />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px 7px' }}>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
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
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedImage) || isGenerating || credits <= 0 || !!pendingPlan}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'none', background: (!input.trim() && !attachedImage) || isGenerating || credits <= 0 ? 'var(--bg-overlay)' : 'var(--accent)', color: (!input.trim() && !attachedImage) || isGenerating || credits <= 0 ? 'var(--ide-text3)' : 'white', cursor: (!input.trim() && !attachedImage) || isGenerating || credits <= 0 ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:11, transition:'var(--t)', fontFamily:'var(--font-sans)', letterSpacing:'-0.01em' }}
            >
              {isGenerating ? (
                <><div style={{ width:10, height:10, border:'1.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Building</>
              ) : planMode ? '◎ Plan' : '⚡ Generate'}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
          <span style={{ fontSize:9, color:'var(--ide-text3)', letterSpacing:'0.02em' }}>↵ SEND · ⇧↵ NEW LINE</span>
        </div>
      </div>
    </div>
  );
}
