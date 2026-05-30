export const CHAT: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState, useRef, useEffect } from 'react'
import './index.css'
const CONTACTS=[
  {id:1,name:'Sarah Chen',avatar:'SC',status:'online',last:'Hey! Did you see the new design?',time:'2m',unread:3,color:'#0EA5E9'},
  {id:2,name:'Marcus Williams',avatar:'MW',status:'online',last:'The API is ready for testing',time:'15m',unread:0,color:'#10b981'},
  {id:3,name:'Design Team',avatar:'DT',status:'online',last:'Priya: Figma link in the thread',time:'1h',unread:7,color:'#8b5cf6'},
  {id:4,name:'Priya Patel',avatar:'PP',status:'away',last:'On it! Will send by EOD',time:'2h',unread:0,color:'#f59e0b'},
  {id:5,name:'Alex Rodriguez',avatar:'AR',status:'offline',last:'Thanks for the review 🙌',time:'3h',unread:0,color:'#ef4444'},
]
type Msg={id:number;text:string;from:'me'|'them';time:string}
const INIT_MSGS:Msg[]=[
  {id:1,text:'Hey! Did you see the latest design mockups?',from:'them',time:'2:31 PM'},
  {id:2,text:'Just checked them out — they look incredible! The dark mode is 🔥',from:'me',time:'2:32 PM'},
  {id:3,text:'Right? The typography system came out exactly how we wanted. Space Grotesk was the right call.',from:'them',time:'2:33 PM'},
  {id:4,text:'Totally agree. Should we schedule a review with the team tomorrow?',from:'me',time:'2:34 PM'},
  {id:5,text:'Yes! 10am works? I\'ll send a calendar invite to everyone.',from:'them',time:'2:35 PM'},
]
export default function App(){
  const [active,setActive]=useState(1)
  const [msgs,setMsgs]=useState<Msg[]>(INIT_MSGS)
  const [input,setInput]=useState('')
  const bottomRef=useRef<HTMLDivElement>(null)
  const contact=CONTACTS.find(c=>c.id===active)!
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),[msgs])
  const send=()=>{
    if(!input.trim())return
    const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    setMsgs(m=>[...m,{id:Date.now(),text:input,from:'me',time:now}])
    setInput('')
    setTimeout(()=>{
      const replies=['Got it! 👍','Makes sense!','On it!','Sounds great!','Let me check and get back to you!']
      setMsgs(m=>[...m,{id:Date.now()+1,text:replies[Math.floor(Math.random()*replies.length)],from:'them',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}])
    },1200)
  }
  return <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
    {/* Sidebar */}
    <div style={{width:280,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{padding:'16px',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:'-0.02em'}}>Messages</span>
          <button style={{width:28,height:28,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:16}}>+</button>
        </div>
        <input placeholder="Search conversations..." style={{width:'100%',padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:12,outline:'none'}}/>
      </div>
      <div style={{overflow:'auto',flex:1}}>
        {CONTACTS.map(c=><div key={c.id} onClick={()=>setActive(c.id)}
          style={{display:'flex',gap:10,padding:'12px 14px',cursor:'pointer',background:active===c.id?'rgba(14,165,233,0.08)':'transparent',borderLeft:active===c.id?'2px solid var(--accent)':'2px solid transparent',transition:'all 0.15s'}}
          onMouseEnter={e=>{if(active!==c.id)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}}
          onMouseLeave={e=>{if(active!==c.id)(e.currentTarget as HTMLElement).style.background='transparent'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>{c.avatar}</div>
            <div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:c.status==='online'?'#22c55e':c.status==='away'?'#f59e0b':'#52525b',border:'2px solid var(--surface)'}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:13,fontWeight:600}}>{c.name}</span>
              <span style={{fontSize:11,color:'var(--text-3)'}}>{c.time}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{c.last}</span>
              {c.unread>0&&<span style={{fontSize:10,fontWeight:700,minWidth:18,height:18,borderRadius:9999,background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{c.unread}</span>}
            </div>
          </div>
        </div>)}
      </div>
    </div>
    {/* Chat */}
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{height:56,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:contact.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>{contact.avatar}</div>
          <div><div style={{fontSize:14,fontWeight:600}}>{contact.name}</div><div style={{fontSize:11,color:contact.status==='online'?'#22c55e':contact.status==='away'?'#f59e0b':'var(--text-3)'}}>{contact.status}</div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {['📞','📹','⋯'].map(i=><button key={i} style={{width:34,height:34,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',fontSize:14}}>{i}</button>)}
        </div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
        {msgs.map(msg=><div key={msg.id} style={{display:'flex',justifyContent:msg.from==='me'?'flex-end':'flex-start',gap:8,alignItems:'flex-end'}}>
          {msg.from==='them'&&<div style={{width:28,height:28,borderRadius:'50%',background:contact.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{contact.avatar}</div>}
          <div>
            <div style={{maxWidth:400,padding:'10px 14px',borderRadius:msg.from==='me'?'var(--r-lg) var(--r-lg) 4px var(--r-lg)':'var(--r-lg) var(--r-lg) var(--r-lg) 4px',background:msg.from==='me'?'var(--accent)':'var(--elevated)',color:msg.from==='me'?'#fff':'var(--text)',fontSize:14,lineHeight:1.5}}>{msg.text}</div>
            <div style={{fontSize:10,color:'var(--text-3)',marginTop:3,textAlign:msg.from==='me'?'right':'left'}}>{msg.time}</div>
          </div>
        </div>)}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:16,borderTop:'1px solid var(--border)',display:'flex',gap:10,alignItems:'center',background:'var(--surface)'}}>
        <button style={{width:34,height:34,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',fontSize:16}}>📎</button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={'Message '+contact.name+'...'} style={{flex:1,padding:'9px 14px',borderRadius:20,border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/>
        <button onClick={send} disabled={!input.trim()} style={{width:34,height:34,borderRadius:'50%',border:'none',background:input.trim()?'var(--accent)':'var(--elevated)',color:input.trim()?'#fff':'var(--text-3)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>↑</button>
      </div>
    </div>
  </div>
}`,
}
