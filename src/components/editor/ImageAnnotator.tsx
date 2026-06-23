'use client';
import { useRef, useState, useEffect } from 'react';

interface Annotation {
  x: number; y: number; width: number; height: number;
  text: string; color: string;
}

interface Props {
  onSubmit: (imageDataUrl: string, annotations: Annotation[], prompt: string) => void;
  onClose: () => void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export function ImageAnnotator({ onSubmit, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [current, setCurrent] = useState<Partial<Annotation> | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [prompt, setPrompt] = useState('');
  const [labelText, setLabelText] = useState('');
  const [showLabel, setShowLabel] = useState(false);
  const [pendingRect, setPendingRect] = useState<Omit<Annotation, 'text' | 'color'> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => { setImage(img); setAnnotations([]); };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const maxW = Math.min(image.width, 700);
    const scale = maxW / image.width;
    canvas.width = maxW;
    canvas.height = image.height * scale;
    redraw(ctx, canvas, image, annotations, current);
  }, [image, annotations, current]);

  const redraw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement, anns: Annotation[], cur: Partial<Annotation> | null) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    [...anns, cur].forEach(a => {
      if (!a?.width || !a?.height) return;
      ctx.strokeStyle = a.color || '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.strokeRect(a.x!, a.y!, a.width, a.height);
      ctx.fillStyle = (a.color || '#EF4444') + '22';
      ctx.fillRect(a.x!, a.y!, a.width, a.height);
      if ((a as Annotation).text) {
        ctx.fillStyle = a.color || '#EF4444';
        ctx.font = 'bold 12px Inter, system-ui';
        ctx.fillRect(a.x!, a.y! - 18, ctx.measureText((a as Annotation).text).width + 8, 18);
        ctx.fillStyle = '#fff';
        ctx.fillText((a as Annotation).text, a.x! + 4, a.y! - 4);
      }
    });
  };

  const getPos = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    setDrawing(true); setStart(pos);
    setCurrent({ x: pos.x, y: pos.y, width: 0, height: 0, color });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    setCurrent({ x: Math.min(start.x, pos.x), y: Math.min(start.y, pos.y), width: Math.abs(pos.x - start.x), height: Math.abs(pos.y - start.y), color });
  };

  const onMouseUp = () => {
    if (!drawing || !current?.width || !current?.height) { setDrawing(false); setCurrent(null); return; }
    setPendingRect({ x: current.x!, y: current.y!, width: current.width, height: current.height });
    setShowLabel(true); setDrawing(false); setCurrent(null);
  };

  const confirmLabel = () => {
    if (!pendingRect) return;
    setAnnotations(prev => [...prev, { ...pendingRect, text: labelText || `Area ${prev.length + 1}`, color }]);
    setLabelText(''); setShowLabel(false); setPendingRect(null);
  };

  const handleSubmit = () => {
    if (!image || !canvasRef.current) return;
    onSubmit(canvasRef.current.toDataURL('image/png'), annotations, prompt);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 14, width: '100%', maxWidth: 780, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Draw on image</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Upload a screenshot, draw on what to change, describe your edit</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!image ? (
            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🖼</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Upload a screenshot</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Click or drag and drop — PNG, JPG, WebP</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Color:</div>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none' }} />
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={() => setAnnotations([])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
                <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>New image</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
              </div>
              <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair' }}>
                <canvas ref={canvasRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} style={{ display: 'block', width: '100%' }} />
                {showLabel && (
                  <div style={{ position: 'absolute', top: (pendingRect?.y || 0) + (pendingRect?.height || 0) + 4, left: pendingRect?.x || 0, background: 'var(--bg-surface)', border: '1px solid var(--sky)', borderRadius: 8, padding: 8, display: 'flex', gap: 6, zIndex: 10, minWidth: 220 }}>
                    <input autoFocus value={labelText} onChange={e => setLabelText(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmLabel()} placeholder="Label this area..."
                      style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={confirmLabel} style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Add</button>
                  </div>
                )}
              </div>
              {annotations.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {annotations.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, background: a.color + '22', border: `1px solid ${a.color}44`, fontSize: 11, color: 'var(--text-primary)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />{a.text}
                      <button onClick={() => setAnnotations(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '0 2px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe what to change (e.g. 'Make the header darker, change button to blue')..." rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={!prompt.trim()} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: !prompt.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !prompt.trim() ? 0.5 : 1 }}>
                  Send to AI with annotations →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}