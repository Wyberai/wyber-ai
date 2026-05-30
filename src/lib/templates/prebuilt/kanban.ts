export const KANBAN: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState } from 'react'
import Board from './components/Board'
import './index.css'
export default function App(){
  return <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
    <header style={{height:54,background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:26,height:26,borderRadius:6,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>K</div>
        <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:15,letterSpacing:'-0.03em'}}>TaskBoard</span>
        <span style={{fontSize:12,color:'var(--text-3)',marginLeft:4}}>/ Product Roadmap Q1 2026</span>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{display:'flex'}}>
          {['S','M','J','P'].map((l,i)=><div key={i} style={{width:26,height:26,borderRadius:'50%',background:'var(--elevated)',border:'2px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,marginLeft:i?-8:0,zIndex:4-i}}>{l}</div>)}
        </div>
        <button style={{padding:'5px 12px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>+ New Task</button>
      </div>
    </header>
    <Board/>
  </div>
}`,
'src/components/Board.tsx': `import { useState } from 'react'
type Priority='high'|'medium'|'low'
type Card={id:number;title:string;desc:string;priority:Priority;assignee:string;tags:string[];comments:number;col:string}
const COLS=['Backlog','To Do','In Progress','Review','Done']
const INIT:Card[]=[
  {id:1,title:'Redesign onboarding flow',desc:'Improve first-run experience for new users with guided setup wizard',priority:'high',assignee:'SC',tags:['Design','UX'],comments:4,col:'In Progress'},
  {id:2,title:'API rate limiting',desc:'Implement per-user rate limits to prevent abuse and ensure fair usage',priority:'high',assignee:'MW',tags:['Backend'],comments:2,col:'Review'},
  {id:3,title:'Dark mode support',desc:'Add system-level dark mode detection and manual toggle',priority:'medium',assignee:'PP',tags:['Frontend'],comments:7,col:'To Do'},
  {id:4,title:'Export to CSV',desc:'Allow users to export their data in CSV format from any table view',priority:'low',assignee:'AR',tags:['Feature'],comments:1,col:'Backlog'},
  {id:5,title:'Mobile responsive nav',desc:'Fix navigation issues on mobile devices below 768px',priority:'high',assignee:'EW',tags:['Frontend','Mobile'],comments:3,col:'In Progress'},
  {id:6,title:'Billing integration',desc:'Integrate Stripe for subscription management and payment processing',priority:'high',assignee:'SC',tags:['Backend','Billing'],comments:8,col:'Done'},
  {id:7,title:'Email notifications',desc:'Send automated emails for key user events and system alerts',priority:'medium',assignee:'MW',tags:['Feature'],comments:2,col:'To Do'},
  {id:8,title:'Search functionality',desc:'Global search across all entities with filters and keyboard shortcuts',priority:'medium',assignee:'PP',tags:['Feature','UX'],comments:5,col:'Backlog'},
]
const PRI:Record<Priority,{color:string;label:string}>={high:{color:'var(--error)',label:'High'},medium:{color:'var(--warning)',label:'Med'},low:{color:'var(--success)',label:'Low'}}
const TAG_COLORS=['rgba(14,165,233,0.15)','rgba(139,92,246,0.15)','rgba(16,185,129,0.15)','rgba(245,158,11,0.15)']
export default function Board(){
  const [cards,setCards]=useState(INIT)
  const [drag,setDrag]=useState<number|null>(null)
  return <div style={{flex:1,overflow:'auto',padding:16,display:'flex',gap:12,alignItems:'flex-start'}}>
    {COLS.map(col=>{
      const colCards=cards.filter(c=>c.col===col)
      return <div key={col} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag!==null)setCards(cs=>cs.map(c=>c.id===drag?{...c,col}:c));setDrag(null)}}
        style={{width:240,flexShrink:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:12,minHeight:400}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{fontSize:12,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{col}</span>
            <span style={{fontSize:11,fontWeight:600,padding:'1px 6px',borderRadius:9999,background:'rgba(255,255,255,0.08)',color:'var(--text-3)'}}>{colCards.length}</span>
          </div>
          <button style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,lineHeight:1}}>+</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {colCards.map(card=><div key={card.id} draggable onDragStart={()=>setDrag(card.id)}
            style={{background:'var(--elevated)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:10,cursor:'grab',transition:'all 0.15s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:700,color:PRI[card.priority].color,background:PRI[card.priority].color+'20',padding:'1px 6px',borderRadius:4}}>{PRI[card.priority].label}</span>
              <div style={{width:22,height:22,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#fff'}}>{card.assignee}</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:4,lineHeight:1.4}}>{card.title}</div>
            <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.5,marginBottom:8}}>{card.desc}</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
              {card.tags.map((t,i)=><span key={t} style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,background:TAG_COLORS[i%TAG_COLORS.length],color:'var(--text-2)'}}>{t}</span>)}
            </div>
            <div style={{fontSize:10,color:'var(--text-3)',display:'flex',gap:8}}>
              <span>💬 {card.comments}</span>
            </div>
          </div>)}
        </div>
      </div>
    })}
  </div>
}`,
}
