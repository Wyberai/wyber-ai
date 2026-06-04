'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const BUILDER_URL = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://wyber-preview-builder-production.up.railway.app'
const MSGS = ['Compiling your app...','Running Vite build...','Bundling components...','Almost there...','Nearly ready...']

export function PreviewPanel() {
  const { files, isGenerating, project } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState<string|null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [elapsed, setElapsed] = useState<number|null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [secs, setSecs] = useState(0)
  const timer = useRef<any>(null)
  const prevGen = useRef(false)
  const lastKey = useRef('')

  const app = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (app?.content?.length ?? 0) > 200

  const build = useCallback(async () => {
    if (!hasApp || building) return
    const key = Object.keys(files).sort().join('|')
    if (key === lastKey.current) return
    lastKey.current = key
    setBuilding(true); setError(null); setSecs(0); setMsgIdx(0)
    const t0 = Date.now()
    timer.current = setInterval(() => { setSecs(s=>s+1); setMsgIdx(i=>(i+1)%MSGS.length) }, 2000)
    try {
      const r = await fetch(BUILDER_URL+'/build', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({files, projectId:project?.id}) })
      const d = await r.json()
      clearInterval(timer.current)
      setElapsed(Math.round((Date.now()-t0)/100)/10)
      d.html ? (setHtml(d.html), setError(null)) : setError(d.error||'Build failed')
    } catch(e:any) { clearInterval(timer.current); setError('Cannot reach preview builder: '+e.message) }
    finally { setBuilding(false) }
  }, [files, hasApp, building, project])

  useEffect(() => { if (prevGen.current && !isGenerating && hasApp) build(); prevGen.current = isGenerating }, [isGenerating, hasApp, build])
  useEffect(() => { if (iframeRef.current && html) iframeRef.current.srcdoc = html }, [html])

  const label = isGenerating ? 'Writing your app...' : building ? MSGS[msgIdx]+' ('+secs+'s)' : elapsed ? 'Built in '+elapsed+'s' : hasApp ? 'Ready' : 'Describe what you want to build'

  return (
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',background:'#09090b',position:'relative'}}>
      <div style={{height:36,display:'flex',alignItems:'center',padding:'0 12px',gap:8,borderBottom:'1px solid rgba(255,255,255,0.06)',background:'#111118',flexShrink:0}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:building?'#f59e0b':html?'#22c55e':'#3f3f46',boxShadow:html?'0 0 6px rgba(34,197,94,0.4)':'none',transition:'all 0.3s',flexShrink:0}}/>
        <span style={{flex:1,fontSize:11,color:'#52525b',fontFamily:'monospace'}}>{label}</span>
        {html&&!building&&<button onClick={()=>{if(iframeRef.current)iframeRef.current.srcdoc=html}} style={{background:'none',border:'1px solid rgba(255,255,255,0.08)',borderRadius:5,color:'#52525b',cursor:'pointer',padding:'2px 8px',fontSize:11}}>↺</button>}
        {hasApp&&!building&&<button onClick={build} style={{background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.3)',borderRadius:5,color:'#0EA5E9',cursor:'pointer',padding:'2px 10px',fontSize:11,fontWeight:600}}>{html?'Rebuild':'Build preview'}</button>}
      </div>
      <div style={{flex:1,minHeight:0,position:'relative'}}>
        {!hasApp&&!isGenerating&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:13,color:'#52525b'}}>Describe what you want to build</span></div>}
        {isGenerating&&<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,background:'#09090b',zIndex:5}}><div style={{width:28,height:28,border:'2px solid rgba(14,165,233,0.15)',borderTopColor:'#0EA5E9',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><span style={{fontSize:13,color:'#71717a'}}>Writing your app...</span></div>}
        {building&&!isGenerating&&<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,background:'#09090b',zIndex:5}}><div style={{width:28,height:28,border:'2px solid rgba(245,158,11,0.15)',borderTopColor:'#f59e0b',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><span style={{fontSize:13,color:'#a1a1aa'}}>{MSGS[msgIdx]}</span><span style={{fontSize:11,color:'#52525b'}}>{secs}s elapsed</span></div>}
        {error&&!building&&<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:24,background:'#09090b',zIndex:5}}><span style={{fontSize:13,color:'#ef4444',textAlign:'center',maxWidth:400,fontFamily:'monospace',whiteSpace:'pre-wrap'}}>{error.slice(0,400)}</span><button onClick={build} style={{padding:'7px 18px',borderRadius:8,border:'none',background:'#0EA5E9',color:'white',fontSize:12,fontWeight:600,cursor:'pointer'}}>Retry</button></div>}
        <iframe ref={iframeRef} title="Wyber Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none',display:html&&!building&&!isGenerating?'block':'none'}}/>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}