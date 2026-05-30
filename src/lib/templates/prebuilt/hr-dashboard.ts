export const HR_DASHBOARD: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#8b5cf6;--accent-2:#7c3aed;--accent-glow:rgba(139,92,246,0.2);--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import Employees from './components/Employees'
import Recruitment from './components/Recruitment'
import './index.css'
const VIEWS={overview:Overview,employees:Employees,recruitment:Recruitment} as const
export default function App(){
  const [view,setView]=useState<keyof typeof VIEWS>('overview')
  const View=VIEWS[view]
  return <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
    <Sidebar view={view} onView={setView}/>
    <main style={{flex:1,overflow:'auto',padding:24}}>
      <View/>
    </main>
  </div>
}`,
'src/components/Sidebar.tsx': `const NAV=[{id:'overview',icon:'▦',label:'Overview'},{id:'employees',icon:'👥',label:'Employees'},{id:'recruitment',icon:'🎯',label:'Recruitment'},{id:'payroll',icon:'💰',label:'Payroll'},{id:'performance',icon:'⭐',label:'Performance'},{id:'settings',icon:'◎',label:'Settings'}]
export default function Sidebar({view,onView}:{view:string;onView:(v:any)=>void}){
  return <aside style={{width:210,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
    <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:9}}>
      <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>H</div>
      <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.03em'}}>HR Central</span>
    </div>
    <nav style={{padding:'8px',flex:1}}>
      {NAV.map(n=><button key={n.id} onClick={()=>onView(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:'var(--r)',border:'none',background:view===n.id?'rgba(139,92,246,0.1)':'transparent',color:view===n.id?'var(--accent)':'var(--text-2)',fontSize:13,fontWeight:view===n.id?600:400,marginBottom:2,textAlign:'left',transition:'all 0.15s'}}><span>{n.icon}</span>{n.label}</button>)}
    </nav>
  </aside>
}`,
'src/components/Overview.tsx': `const STATS=[{label:'Total Employees',value:'247',change:'+12',up:true,icon:'👥'},{label:'Open Positions',value:'18',change:'+5',up:true,icon:'🎯'},{label:'Avg Tenure',value:'2.8y',change:'+0.3',up:true,icon:'📅'},{label:'Attrition Rate',value:'4.2%',change:'-1.1%',up:true,icon:'📉'}]
const DEPTS=[{name:'Engineering',count:89,color:'#0EA5E9'},{name:'Product',count:34,color:'#8b5cf6'},{name:'Design',count:22,color:'#f59e0b'},{name:'Marketing',count:31,color:'#10b981'},{name:'Sales',count:48,color:'#ef4444'},{name:'Operations',count:23,color:'#6b7280'}]
const EVENTS=[{type:'birthday',text:'Emma Wilson\'s birthday 🎂',time:'Today'},{ type:'anniversary',text:'Marcus Williams — 3 years! 🎉',time:'Tomorrow'},{type:'new',text:'New hire: Priya Patel (Design)',time:'Mon, Jun 2'},{type:'offboard',text:'Alex Rodriguez last day',time:'Fri, May 30'},{type:'review',text:'Q1 performance reviews due',time:'Jun 15'}]
export default function Overview(){
  return <div>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:4}}>HR Overview</h1>
    <p style={{fontSize:13,color:'var(--text-2)',marginBottom:20}}>May 2026 · 247 employees across 6 departments</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
      {STATS.map(s=><div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <span style={{fontSize:20}}>{s.icon}</span>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:9999,background:s.up?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',color:s.up?'var(--success)':'var(--error)'}}>{s.change}</span>
        </div>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:24,fontWeight:700,letterSpacing:'-0.04em',marginBottom:2}}>{s.value}</div>
        <div style={{fontSize:12,color:'var(--text-2)'}}>{s.label}</div>
      </div>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Headcount by Department</div>
        {DEPTS.map(d=><div key={d.name} style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:12,color:'var(--text-2)'}}>{d.name}</span>
            <span style={{fontSize:12,fontWeight:600}}>{d.count}</span>
          </div>
          <div style={{height:4,borderRadius:9999,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:(d.count/89*100)+'%',maxWidth:'100%',borderRadius:9999,background:d.color,transition:'width 1s ease'}}/></div>
        </div>)}
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Upcoming Events</div>
        {EVENTS.map((e,i)=><div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<EVENTS.length-1?'1px solid var(--border)':'none',alignItems:'flex-start'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:e.type==='birthday'?'#f59e0b':e.type==='anniversary'?'var(--success)':e.type==='new'?'var(--accent)':e.type==='offboard'?'var(--error)':'var(--text-3)',flexShrink:0,marginTop:4}}/>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,marginBottom:1}}>{e.text}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{e.time}</div></div>
        </div>)}
      </div>
    </div>
  </div>
}`,
'src/components/Employees.tsx': `import { useState } from 'react'
const EMPS=[
  {name:'Sarah Chen',role:'Product Lead',dept:'Product',status:'active',email:'sarah@co.com',phone:'+1 415 555 0123',tenure:'3y 2m',avatar:'SC',color:'#0EA5E9'},
  {name:'Marcus Williams',role:'Senior Engineer',dept:'Engineering',status:'active',email:'marcus@co.com',phone:'+1 628 555 0145',tenure:'2y 8m',avatar:'MW',color:'#10b981'},
  {name:'Priya Patel',role:'UX Designer',dept:'Design',status:'active',email:'priya@co.com',phone:'+1 510 555 0167',tenure:'1y 3m',avatar:'PP',color:'#8b5cf6'},
  {name:'Alex Rodriguez',role:'Account Executive',dept:'Sales',status:'notice',email:'alex@co.com',phone:'+1 650 555 0189',tenure:'0y 11m',avatar:'AR',color:'#ef4444'},
  {name:'Emma Wilson',role:'Marketing Manager',dept:'Marketing',status:'active',email:'emma@co.com',phone:'+1 415 555 0234',tenure:'4y 1m',avatar:'EW',color:'#f59e0b'},
  {name:'David Kim',role:'DevOps Engineer',dept:'Engineering',status:'active',email:'david@co.com',phone:'+1 628 555 0256',tenure:'2y 5m',avatar:'DK',color:'#0EA5E9'},
]
const STATUS:Record<string,{color:string;label:string}>={active:{color:'var(--success)',label:'Active'},notice:{color:'var(--warning)',label:'Notice'}}
export default function Employees(){
  const [search,setSearch]=useState('')
  const filtered=EMPS.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||e.dept.toLowerCase().includes(search.toLowerCase()))
  return <div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em'}}>Employees</h1>
      <div style={{display:'flex',gap:8}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or dept..." style={{padding:'7px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,width:220,outline:'none'}}/>
        <button style={{padding:'7px 14px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600}}>+ Add Employee</button>
      </div>
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
        <thead><tr>{['Employee','Department','Status','Tenure','Contact',''].map(h=><th key={h} style={{padding:'9px 14px',fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',textAlign:'left',borderBottom:'1px solid var(--border)',background:'var(--elevated)'}}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map((e,i)=><tr key={i} style={{transition:'background 0.15s'}} onMouseEnter={el=>(el.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'} onMouseLeave={el=>(el.currentTarget as HTMLElement).style.background='transparent'}>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><div style={{display:'flex',alignItems:'center',gap:9}}><div style={{width:32,height:32,borderRadius:'50%',background:e.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{e.avatar}</div><div><div style={{fontSize:13,fontWeight:600}}>{e.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{e.role}</div></div></div></td>
          <td style={{padding:'12px 14px',fontSize:13,color:'var(--text-2)',borderBottom:'1px solid var(--border)'}}>{e.dept}</td>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:9999,background:STATUS[e.status].color+'20',color:STATUS[e.status].color}}>{STATUS[e.status].label}</span></td>
          <td style={{padding:'12px 14px',fontSize:13,color:'var(--text-2)',borderBottom:'1px solid var(--border)'}}>{e.tenure}</td>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><div style={{fontSize:12,color:'var(--text-2)'}}>{e.email}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{e.phone}</div></td>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><button style={{padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:11}}>View</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>
}`,
'src/components/Recruitment.tsx': `const JOBS=[{title:'Senior React Engineer',dept:'Engineering',posted:'3 days ago',applicants:42,stage:'Active'},{title:'Product Designer (UI/UX)',dept:'Design',posted:'1 week ago',applicants:28,stage:'Active'},{title:'Growth Marketing Manager',dept:'Marketing',posted:'2 weeks ago',applicants:67,stage:'Interviewing'},{title:'DevOps / SRE',dept:'Engineering',posted:'1 month ago',applicants:19,stage:'Offer Sent'}]
const PIPELINE=[{name:'Sarah Chen',role:'Senior React Engineer',stage:'Technical',score:4.5,avatar:'SC'},{name:'James Park',role:'Product Designer',stage:'Portfolio Review',score:4.2,avatar:'JP'},{name:'Priya Sharma',role:'Growth Marketing',stage:'Final Interview',score:4.8,avatar:'PS'},{name:'Alex Wu',role:'DevOps',stage:'Reference Check',score:4.1,avatar:'AW'}]
export default function Recruitment(){
  return <div>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:20}}>Recruitment</h1>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
      {[['18','Open Positions'],['156','Total Applicants'],['4','Offers Pending'],['23','Hired This Month']].map(([v,l])=><div key={l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:700,letterSpacing:'-0.04em',marginBottom:2}}>{v}</div>
        <div style={{fontSize:12,color:'var(--text-2)'}}>{l}</div>
      </div>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:700}}>Open Positions</div>
        {JOBS.map((j,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{j.title}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{j.dept} · {j.posted}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>{j.applicants}</div><div style={{fontSize:11,color:'var(--text-3)'}}>applicants</div></div>
          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:j.stage==='Offer Sent'?'rgba(34,197,94,0.1)':j.stage==='Interviewing'?'rgba(245,158,11,0.1)':'rgba(14,165,233,0.1)',color:j.stage==='Offer Sent'?'var(--success)':j.stage==='Interviewing'?'var(--warning)':'var(--accent)'}}>{j.stage}</span>
        </div>)}
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:700}}>Candidate Pipeline</div>
        {PIPELINE.map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{c.avatar}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:1}}>{c.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{c.role}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:11,fontWeight:600,color:'var(--text-2)',marginBottom:2}}>{c.stage}</div><div style={{fontSize:11,color:'var(--accent)'}}>★ {c.score}</div></div>
        </div>)}
      </div>
    </div>
  </div>
}`,
}
