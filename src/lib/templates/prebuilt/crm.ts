export const CRM: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--border-2:rgba(255,255,255,0.13);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--accent-2:#0284C7;--accent-glow:rgba(14,165,233,0.2);--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--r-sm:6px;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif;font-size:14px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ContactList from './components/ContactList'
import Pipeline from './components/Pipeline'
import ContactDetail from './components/ContactDetail'
import './index.css'
const VIEWS=['contacts','pipeline','detail'] as const
type View=typeof VIEWS[number]
export default function App(){
  const [view,setView]=useState<View>('contacts')
  const [selected,setSelected]=useState(0)
  const onSelect=(i:number)=>{setSelected(i);setView('detail')}
  return <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
    <Sidebar view={view} onView={setView}/>
    <main style={{flex:1,overflow:'auto'}}>
      {view==='contacts'&&<ContactList onSelect={onSelect}/>}
      {view==='pipeline'&&<Pipeline/>}
      {view==='detail'&&<ContactDetail onBack={()=>setView('contacts')} idx={selected}/>}
    </main>
  </div>
}`,
'src/components/Sidebar.tsx': `const NAV=[{id:'contacts',label:'Contacts',icon:'👥'},{id:'pipeline',label:'Pipeline',icon:'◑'},{id:'analytics',label:'Analytics',icon:'📈'},{id:'emails',label:'Emails',icon:'✉'},{id:'settings',label:'Settings',icon:'◎'}]
export default function Sidebar({view,onView}:{view:string;onView:(v:any)=>void}){
  return <aside style={{width:200,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
    <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>C</div>
      <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.03em'}}>CRM Pro</span>
    </div>
    <nav style={{padding:'8px',flex:1}}>
      {NAV.map(n=><button key={n.id} onClick={()=>onView(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:'var(--r)',border:'none',background:view===n.id?'rgba(14,165,233,0.1)':'transparent',color:view===n.id?'var(--accent)':'var(--text-2)',fontSize:13,fontWeight:view===n.id?600:400,marginBottom:2,textAlign:'left',transition:'all 0.15s'}}><span>{n.icon}</span>{n.label}</button>)}
    </nav>
    <div style={{padding:'12px 8px',borderTop:'1px solid var(--border)'}}>
      <div style={{display:'flex',gap:8,padding:'8px 10px',borderRadius:'var(--r)',background:'var(--elevated)',alignItems:'center'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>J</div>
        <div><div style={{fontSize:12,fontWeight:600}}>James Park</div><div style={{fontSize:10,color:'var(--text-3)'}}>Sales Lead</div></div>
      </div>
    </div>
  </aside>
}`,
'src/components/ContactList.tsx': `const CONTACTS=[
  {name:'Sarah Chen',company:'Stripe',email:'sarah@stripe.com',phone:'+1 415 555 0123',stage:'Qualified',value:'$12,000',last:'2 hrs ago',avatar:'SC'},
  {name:'Marcus Williams',company:'Notion',email:'marcus@notion.so',phone:'+1 628 555 0145',stage:'Proposal',value:'$8,500',last:'Yesterday',avatar:'MW'},
  {name:'Priya Patel',company:'Figma',email:'priya@figma.com',phone:'+1 510 555 0167',stage:'Negotiation',value:'$24,000',last:'2 days ago',avatar:'PP'},
  {name:'Alex Rodriguez',company:'Vercel',email:'alex@vercel.com',phone:'+1 650 555 0189',stage:'Lead',value:'$3,200',last:'3 days ago',avatar:'AR'},
  {name:'Emma Wilson',company:'Linear',email:'emma@linear.app',phone:'+1 415 555 0234',stage:'Won',value:'$15,000',last:'1 week ago',avatar:'EW'},
  {name:'David Kim',company:'Loom',email:'david@loom.com',phone:'+1 628 555 0256',stage:'Lead',value:'$5,600',last:'2 weeks ago',avatar:'DK'},
]
const STAGE_COLORS:Record<string,string>={Lead:'var(--text-3)',Qualified:'var(--accent)',Proposal:'var(--warning)',Negotiation:'#8b5cf6',Won:'var(--success)',Lost:'var(--error)'}
export default function ContactList({onSelect}:{onSelect:(i:number)=>void}){
  return <div style={{padding:24}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <div><h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:2}}>Contacts</h1><p style={{fontSize:13,color:'var(--text-2)'}}>{CONTACTS.length} contacts · 3 active deals</p></div>
      <div style={{display:'flex',gap:8}}>
        <input placeholder="Search contacts..." style={{padding:'7px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,width:200,outline:'none'}}/>
        <button style={{padding:'7px 16px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600}}>+ Add Contact</button>
      </div>
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
        <thead><tr>{['Name','Company','Stage','Value','Last Activity',''].map(h=><th key={h} style={{padding:'9px 14px',fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',textAlign:'left',borderBottom:'1px solid var(--border)',background:'var(--elevated)'}}>{h}</th>)}</tr></thead>
        <tbody>{CONTACTS.map((c,i)=><tr key={i} onClick={()=>onSelect(i)} style={{cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><div style={{display:'flex',alignItems:'center',gap:9}}><div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{c.avatar}</div><div><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{c.email}</div></div></div></td>
          <td style={{padding:'12px 14px',fontSize:13,color:'var(--text-2)',borderBottom:'1px solid var(--border)'}}>{c.company}</td>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:9999,background:(STAGE_COLORS[c.stage]||'var(--text-3)')+'20',color:STAGE_COLORS[c.stage]||'var(--text-3)'}}>{c.stage}</span></td>
          <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,borderBottom:'1px solid var(--border)'}}>{c.value}</td>
          <td style={{padding:'12px 14px',fontSize:12,color:'var(--text-3)',borderBottom:'1px solid var(--border)'}}>{c.last}</td>
          <td style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}><button style={{padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:11}}>View →</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>
}`,
'src/components/Pipeline.tsx': `const STAGES=['Lead','Qualified','Proposal','Negotiation','Won']
const DEALS=[
  {name:'Stripe Enterprise',contact:'Sarah Chen',value:'$12,000',stage:'Qualified',prob:60,days:14},
  {name:'Notion Teams',contact:'Marcus Williams',value:'$8,500',stage:'Proposal',prob:75,days:7},
  {name:'Figma Platform',contact:'Priya Patel',value:'$24,000',stage:'Negotiation',prob:85,days:3},
  {name:'Vercel Startup',contact:'Alex Rodriguez',value:'$3,200',stage:'Lead',prob:20,days:21},
  {name:'Linear Pro',contact:'Emma Wilson',value:'$15,000',stage:'Won',prob:100,days:0},
  {name:'Loom Business',contact:'David Kim',value:'$5,600',stage:'Lead',prob:15,days:30},
]
export default function Pipeline(){
  return <div style={{padding:24}}>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:4}}>Pipeline</h1>
    <p style={{fontSize:13,color:'var(--text-2)',marginBottom:20}}>Total value: $68,300 · 6 active deals</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,overflowX:'auto'}}>
      {STAGES.map(stage=>{
        const cards=DEALS.filter(d=>d.stage===stage)
        const total=cards.reduce((s,d)=>s+parseInt(d.value.replace(/[$,]/g,'')),0)
        return <div key={stage} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:12,minHeight:400}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>{stage}</div>
            <div style={{fontSize:12,color:'var(--text-2)'}}>{cards.length} deals · {'$'}{total.toLocaleString()}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {cards.map((d,i)=><div key={i} style={{background:'var(--elevated)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:10,cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none'}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>{d.name}</div>
              <div style={{fontSize:11,color:'var(--text-2)',marginBottom:6}}>{d.contact}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:13,fontWeight:700,color:'var(--accent)'}}>{d.value}</span>
                <span style={{fontSize:10,color:'var(--text-3)'}}>{d.prob}%</span>
              </div>
              <div style={{height:3,borderRadius:9999,background:'rgba(255,255,255,0.06)',marginTop:8}}><div style={{height:'100%',width:d.prob+'%',borderRadius:9999,background:'var(--accent)'}}/></div>
            </div>)}
          </div>
        </div>
      })}
    </div>
  </div>
}`,
'src/components/ContactDetail.tsx': `const CONTACTS=[
  {name:'Sarah Chen',company:'Stripe',email:'sarah@stripe.com',phone:'+1 415 555 0123',stage:'Qualified',value:'$12,000',avatar:'SC',title:'Head of Partnerships',linkedin:'linkedin.com/in/sarahchen',tags:['Enterprise','Hot Lead','Decision Maker'],notes:'Interested in the enterprise plan. Has budget approved for Q1. Needs security compliance docs.',activities:[{type:'call',text:'Discovery call — discussed enterprise needs',time:'2 hrs ago'},{type:'email',text:'Sent security compliance questionnaire',time:'Yesterday'},{type:'meeting',text:'Product demo scheduled',time:'Next Monday'}]},
]
export default function ContactDetail({onBack,idx}:{onBack:()=>void;idx:number}){
  const c=CONTACTS[0]
  return <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
    <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:13,marginBottom:20}}>← Back to contacts</button>
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16}}>
      <div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:20,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',flexShrink:0}}>{c.avatar}</div>
            <div><h2 style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,letterSpacing:'-0.03em',marginBottom:2}}>{c.name}</h2><p style={{fontSize:13,color:'var(--text-2)'}}>{c.title} at {c.company}</p></div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <button style={{padding:'6px 14px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:12}}>Send Email</button>
              <button style={{padding:'6px 14px',borderRadius:'var(--r-sm)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>Log Call</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['Email',c.email],['Phone',c.phone],['LinkedIn',c.linkedin],['Deal Value',c.value]].map(([l,v])=><div key={l}><div style={{fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>{l}</div><div style={{fontSize:13,color:'var(--text)'}}>{v}</div></div>)}
          </div>
          <div style={{marginTop:14,display:'flex',gap:6,flexWrap:'wrap'}}>
            {c.tags.map(t=><span key={t} style={{fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:9999,background:'rgba(14,165,233,0.1)',color:'var(--accent)',border:'1px solid rgba(14,165,233,0.2)'}}>{t}</span>)}
          </div>
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:20}}>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>Activity Timeline</h3>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {c.activities.map((a,i)=><div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>{a.type==='call'?'📞':a.type==='email'?'✉':'📅'}</div>
              <div><div style={{fontSize:13}}>{a.text}</div><div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{a.time}</div></div>
            </div>)}
          </div>
        </div>
      </div>
      <div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16,marginBottom:12}}>
          <h3 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Deal Info</h3>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[['Stage',c.stage],['Value',c.value],['Close Date','Mar 31, 2026'],['Probability','60%'],['Source','LinkedIn']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--text-2)'}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>)}
          </div>
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
          <h3 style={{fontSize:13,fontWeight:700,marginBottom:8}}>Notes</h3>
          <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>{c.notes}</p>
          <textarea placeholder="Add a note..." style={{width:'100%',marginTop:10,padding:'8px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:12,resize:'none',height:72,fontFamily:'inherit',outline:'none'}}/>
          <button style={{width:'100%',marginTop:8,padding:'7px',borderRadius:'var(--r-sm)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>Save Note</button>
        </div>
      </div>
    </div>
  </div>
}`,
}
