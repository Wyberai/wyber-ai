export const ADMIN_DASHBOARD: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--overlay:#222228;--border:rgba(255,255,255,0.07);--border-2:rgba(255,255,255,0.13);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--accent-2:#0284C7;--accent-glow:rgba(14,165,233,0.2);--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--r-sm:6px;--r:8px;--r-lg:12px;--shadow:0 1px 3px rgba(0,0,0,0.5);--shadow-lg:0 10px 40px rgba(0,0,0,0.6);font-family:'Space Grotesk',sans-serif;font-size:14px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,

'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StatsGrid from './components/StatsGrid'
import DataTable from './components/DataTable'
import ActivityFeed from './components/ActivityFeed'
import './index.css'
export default function App() {
  const [activeNav,setActiveNav]=useState('overview')
  return <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
    <Sidebar active={activeNav} onNav={setActiveNav}/>
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Header/>
      <main style={{flex:1,overflow:'auto',padding:24}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontFamily:'Sora,sans-serif',fontSize:24,fontWeight:700,letterSpacing:'-0.03em',marginBottom:4}}>Good morning, Sarah 👋</h1>
          <p style={{fontSize:13,color:'var(--text-2)'}}>Here\'s what\'s happening with your product today.</p>
        </div>
        <StatsGrid/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,marginTop:16}}>
          <DataTable/><ActivityFeed/>
        </div>
      </main>
    </div>
  </div>
}`,

'src/components/Sidebar.tsx': `const NAV=[
  {id:'overview',icon:'▦',label:'Overview'},
  {id:'analytics',icon:'◷',label:'Analytics'},
  {id:'customers',icon:'◈',label:'Customers'},
  {id:'products',icon:'⊞',label:'Products'},
  {id:'orders',icon:'◑',label:'Orders'},
  {id:'settings',icon:'◎',label:'Settings'},
]
const PROJECTS=[
  {name:'Dashboard v2',color:'#0EA5E9',pct:68},
  {name:'Mobile App',color:'#8b5cf6',pct:34},
  {name:'API Platform',color:'#10b981',pct:92},
]
export default function Sidebar({active,onNav}:{active:string;onNav:(id:string)=>void}){
  return <aside style={{width:220,height:'100vh',background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
    <div style={{height:56,display:'flex',alignItems:'center',padding:'0 16px',borderBottom:'1px solid var(--border)',gap:10}}>
      <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>W</div>
      <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.03em'}}>WorkSpace</span>
    </div>
    <div style={{padding:'10px 8px',flex:1,overflow:'auto'}}>
      <div style={{marginBottom:16}}>
        {NAV.map(n=><button key={n.id} onClick={()=>onNav(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:'var(--r)',border:'none',background:active===n.id?'rgba(14,165,233,0.1)':'transparent',color:active===n.id?'var(--accent)':'var(--text-2)',fontSize:13,fontWeight:active===n.id?600:400,marginBottom:1,textAlign:'left',transition:'all 0.15s'}} onMouseEnter={e=>{if(active!==n.id)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}} onMouseLeave={e=>{if(active!==n.id)(e.currentTarget as HTMLElement).style.background='transparent'}}>
          <span style={{fontSize:14}}>{n.icon}</span>{n.label}
          {n.id==='orders'&&<span style={{marginLeft:'auto',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:9999,background:'rgba(239,68,68,0.15)',color:'var(--error)'}}>3</span>}
        </button>)}
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',padding:'4px 10px 8px'}}>Projects</div>
        {PROJECTS.map(p=><div key={p.name} style={{padding:'7px 10px',borderRadius:'var(--r)',marginBottom:2,cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/><span style={{fontSize:12,color:'var(--text-2)'}}>{p.name}</span></div>
            <span style={{fontSize:10,color:'var(--text-3)'}}>{p.pct}%</span>
          </div>
          <div style={{height:3,borderRadius:9999,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:p.pct+'%',borderRadius:9999,background:p.color}}/></div>
        </div>)}
      </div>
    </div>
    <div style={{padding:'10px 8px',borderTop:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:'var(--r)',background:'var(--elevated)'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>S</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Sarah Chen</div><div style={{fontSize:10,color:'var(--text-3)'}}>Pro plan</div></div>
      </div>
    </div>
  </aside>
}`,

'src/components/Header.tsx': `export default function Header(){
  return <header style={{height:56,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'var(--surface)',flexShrink:0}}>
    <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--elevated)',borderRadius:'var(--r)',padding:'6px 12px',border:'1px solid var(--border)',flex:1,maxWidth:320}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input placeholder="Search..." style={{border:'none',background:'transparent',color:'var(--text)',fontSize:13,outline:'none',width:'100%'}}/>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <button style={{width:34,height:34,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        <div style={{position:'absolute',top:6,right:6,width:7,height:7,borderRadius:'50%',background:'var(--error)',border:'1.5px solid var(--surface)'}}/>
      </button>
      <div style={{width:34,height:34,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer'}}>S</div>
    </div>
  </header>
}`,

'src/components/StatsGrid.tsx': `const STATS=[
  {label:'Monthly Revenue',value:'$48,295',change:'+12.4%',up:true,color:'#0EA5E9',icon:'💰'},
  {label:'Active Users',value:'2,847',change:'+8.1%',up:true,color:'#10b981',icon:'👥'},
  {label:'New Signups',value:'384',change:'-2.3%',up:false,color:'#f59e0b',icon:'✨'},
  {label:'Churn Rate',value:'2.1%',change:'-0.4%',up:true,color:'#8b5cf6',icon:'📉'},
]
export default function StatsGrid(){
  return <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
    {STATS.map(s=><div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18,transition:'all 0.2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=s.color+'40';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:38,height:38,borderRadius:'var(--r)',background:s.color+'18',border:'1px solid '+s.color+'30',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{s.icon}</div>
        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:9999,background:s.up?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',color:s.up?'var(--success)':'var(--error)'}}>{s.change}</span>
      </div>
      <div style={{fontFamily:'Sora,sans-serif',fontSize:26,fontWeight:700,letterSpacing:'-0.04em',marginBottom:2}}>{s.value}</div>
      <div style={{fontSize:12,color:'var(--text-2)'}}>{s.label}</div>
    </div>)}
  </div>
}`,

'src/components/DataTable.tsx': `import { useState } from 'react'
const TABS=['All','Active','Inactive','Pending']
const DATA=[
  {name:'Sarah Chen',email:'sarah@acme.com',plan:'Pro',status:'active',revenue:'$1,240',joined:'Jan 12'},
  {name:'Marcus Williams',email:'marcus@globex.com',plan:'Starter',status:'active',revenue:'$49',joined:'Jan 18'},
  {name:'James Park',email:'james@initech.com',plan:'Pro',status:'pending',revenue:'$580',joined:'Jan 22'},
  {name:'Priya Patel',email:'priya@hooli.com',plan:'Enterprise',status:'active',revenue:'$3,200',joined:'Dec 5'},
  {name:'Alex Rodriguez',email:'alex@umbrella.com',plan:'Starter',status:'inactive',revenue:'$0',joined:'Nov 30'},
  {name:'Emma Wilson',email:'emma@dunder.com',plan:'Pro',status:'active',revenue:'$890',joined:'Jan 28'},
]
const STATUS:Record<string,{bg:string;color:string}>={active:{bg:'rgba(34,197,94,0.1)',color:'#22c55e'},inactive:{bg:'rgba(239,68,68,0.1)',color:'#ef4444'},pending:{bg:'rgba(245,158,11,0.1)',color:'#f59e0b'}}
export default function DataTable(){
  const [tab,setTab]=useState('All')
  const rows=tab==='All'?DATA:DATA.filter(d=>d.status===tab.toLowerCase())
  return <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{fontSize:14,fontWeight:600,letterSpacing:'-0.02em'}}>Customers</div>
      <div style={{display:'flex',gap:2,background:'var(--elevated)',padding:2,borderRadius:'var(--r-sm)'}}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'4px 10px',borderRadius:5,border:'none',background:tab===t?'var(--surface)':'transparent',color:tab===t?'var(--text)':'var(--text-2)',fontSize:11,fontWeight:500,transition:'all 0.15s'}}>{t}</button>)}
      </div>
    </div>
    <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
      <thead><tr>{['Customer','Plan','Status','Revenue','Joined'].map(h=><th key={h} style={{padding:'9px 14px',fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',textAlign:'left',borderBottom:'1px solid var(--border)',background:'var(--elevated)'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i} style={{transition:'background 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
        <td style={{padding:'11px 14px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{r.name.charAt(0)}</div>
            <div><div style={{fontSize:13,fontWeight:500}}>{r.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{r.email}</div></div>
          </div>
        </td>
        <td style={{padding:'11px 14px',fontSize:13,color:'var(--text-2)',borderBottom:'1px solid var(--border)'}}>{r.plan}</td>
        <td style={{padding:'11px 14px',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:9999,...STATUS[r.status]}}>{r.status}</span></td>
        <td style={{padding:'11px 14px',fontSize:13,fontWeight:600,borderBottom:'1px solid var(--border)'}}>{r.revenue}</td>
        <td style={{padding:'11px 14px',fontSize:12,color:'var(--text-2)',borderBottom:'1px solid var(--border)'}}>{r.joined}</td>
      </tr>)}</tbody>
    </table>
  </div>
}`,

'src/components/ActivityFeed.tsx': `const ACTIVITIES=[
  {user:'Sarah Chen',action:'upgraded to Pro',time:'2 min ago',seed:'Sarah',type:'upgrade'},
  {user:'Marcus Williams',action:'submitted a support ticket',time:'14 min ago',seed:'Marcus',type:'support'},
  {user:'New signup',action:'James Park joined',time:'32 min ago',seed:'James',type:'signup'},
  {user:'Priya Patel',action:'paid invoice #1042',time:'1 hr ago',seed:'Priya',type:'payment'},
  {user:'Alex Rodriguez',action:'cancelled subscription',time:'3 hrs ago',seed:'Alex',type:'cancel'},
  {user:'Emma Wilson',action:'reached 1k API calls',time:'5 hrs ago',seed:'Emma',type:'milestone'},
]
const TYPE_COLORS:Record<string,string>={upgrade:'var(--success)',support:'var(--warning)',signup:'var(--accent)',payment:'var(--success)',cancel:'var(--error)',milestone:'#8b5cf6'}
export default function ActivityFeed(){
  return <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontSize:14,fontWeight:600,letterSpacing:'-0.02em',flexShrink:0}}>Activity</div>
    <div style={{overflow:'auto',flex:1}}>
      {ACTIVITIES.map((a,i)=><div key={i} style={{display:'flex',gap:10,padding:'11px 14px',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
        <img src={'https://api.dicebear.com/7.x/avataaars/svg?seed='+a.seed} alt="" style={{width:30,height:30,borderRadius:'50%',background:'var(--elevated)',flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,lineHeight:1.5}}><span style={{fontWeight:600}}>{a.user}</span> <span style={{color:'var(--text-2)'}}>{a.action}</span></div>
          <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{a.time}</div>
        </div>
        <div style={{width:7,height:7,borderRadius:'50%',background:TYPE_COLORS[a.type],flexShrink:0,marginTop:4}}/>
      </div>)}
    </div>
  </div>
}`,
}
