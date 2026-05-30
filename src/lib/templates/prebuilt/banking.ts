export const BANKING: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#10b981;--accent-2:#059669;--accent-glow:rgba(16,185,129,0.2);--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Accounts from './components/Accounts'
import Transactions from './components/Transactions'
import Transfer from './components/Transfer'
import './index.css'
const VIEWS={accounts:Accounts,transactions:Transactions,transfer:Transfer} as const
export default function App(){
  const [view,setView]=useState<keyof typeof VIEWS>('accounts')
  const View=VIEWS[view]
  return <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
    <Sidebar view={view} onView={setView}/>
    <main style={{flex:1,overflow:'auto',padding:24}}>
      <View/>
    </main>
  </div>
}`,
'src/components/Sidebar.tsx': `const NAV=[{id:'accounts',icon:'🏦',label:'Accounts'},{id:'transactions',icon:'↕',label:'Transactions'},{id:'transfer',icon:'⇄',label:'Transfer'},{id:'cards',icon:'💳',label:'Cards'},{id:'bills',icon:'📄',label:'Bills'},{id:'settings',icon:'◎',label:'Settings'}]
export default function Sidebar({view,onView}:{view:string;onView:(v:any)=>void}){
  return <aside style={{width:210,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0}}>
    <div style={{padding:'16px',borderBottom:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9}}>
        <div style={{width:32,height:32,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🏦</div>
        <div><div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.03em'}}>FinanceApp</div><div style={{fontSize:10,color:'var(--text-3)'}}>Personal Banking</div></div>
      </div>
    </div>
    <nav style={{padding:'8px',flex:1}}>
      {NAV.map(n=><button key={n.id} onClick={()=>onView(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:'var(--r)',border:'none',background:view===n.id?'rgba(16,185,129,0.1)':'transparent',color:view===n.id?'var(--accent)':'var(--text-2)',fontSize:13,fontWeight:view===n.id?600:400,marginBottom:2,textAlign:'left',transition:'all 0.15s'}}><span>{n.icon}</span>{n.label}</button>)}
    </nav>
    <div style={{padding:'12px',borderTop:'1px solid var(--border)'}}>
      <div style={{display:'flex',gap:8,padding:'10px',borderRadius:'var(--r)',background:'var(--elevated)',alignItems:'center'}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>S</div>
        <div><div style={{fontSize:12,fontWeight:600}}>Sarah Chen</div><div style={{fontSize:10,color:'var(--text-3)'}}>Premium Member</div></div>
      </div>
    </div>
  </aside>
}`,
'src/components/Accounts.tsx': `const ACCOUNTS=[
  {name:'Checking Account',number:'••••4821',balance:12847.50,type:'checking',color:'#10b981',icon:'🏦'},
  {name:'Savings Account',number:'••••7293',balance:48320.00,type:'savings',color:'#0EA5E9',icon:'💰'},
  {name:'Investment Portfolio',number:'••••3847',balance:124891.33,type:'investment',color:'#8b5cf6',icon:'📈'},
  {name:'Credit Card',number:'••••9156',balance:-2847.80,type:'credit',color:'#ef4444',icon:'💳',limit:15000},
]
const SPENDING=[{cat:'Housing',amount:2100,pct:42,color:'#0EA5E9'},{cat:'Food',amount:680,pct:13,color:'#10b981'},{cat:'Transport',amount:420,pct:8,color:'#f59e0b'},{cat:'Shopping',amount:340,pct:7,color:'#8b5cf6'},{cat:'Entertainment',amount:180,pct:4,color:'#ef4444'},{cat:'Other',amount:530,pct:11,color:'#64748b'}]
export default function Accounts(){
  const total=ACCOUNTS.filter(a=>a.type!=='credit').reduce((s,a)=>s+a.balance,0)
  return <div>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:4}}>My Accounts</h1>
    <p style={{fontSize:13,color:'var(--text-2)',marginBottom:20>Total net worth: <strong style={{color:'var(--accent)'}}>{"$"}{total.toLocaleString('en',{minimumFractionDigits:2})}</strong></p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
      {ACCOUNTS.map(a=><div key={a.name} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18,transition:'all 0.2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=a.color+'40';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{width:40,height:40,borderRadius:'var(--r)',background:a.color+'18',border:'1px solid '+a.color+'30',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{a.icon}</div>
          <div><div style={{fontSize:13,fontWeight:700}}>{a.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{a.number}</div></div>
        </div>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:800,letterSpacing:'-0.04em',color:a.balance<0?'var(--error)':a.color}}>{a.balance<0?'-':''}{'$'}{Math.abs(a.balance).toLocaleString('en',{minimumFractionDigits:2})}</div>
        {a.type==='credit'&&a.limit&&<div style={{marginTop:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',marginBottom:4}}><span>Used</span><span>{'$'}{Math.abs(a.balance).toLocaleString()} / {'$'}{a.limit.toLocaleString()}</span></div><div style={{height:4,borderRadius:9999,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:(Math.abs(a.balance)/a.limit*100)+'%',borderRadius:9999,background:'var(--error)'}}/></div></div>}
        <div style={{marginTop:10,display:'flex',gap:6}}>
          <button style={{flex:1,padding:'5px',borderRadius:6,border:'none',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:600}}>Add Funds</button>
          <button style={{flex:1,padding:'5px',borderRadius:6,border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:11}}>Transfer</button>
        </div>
      </div>)}
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>May Spending Breakdown</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          {SPENDING.map(s=><div key={s.cat} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12,color:'var(--text-2)'}}>{s.cat}</span>
              <span style={{fontSize:12,fontWeight:600}}>{'$'}{s.amount}</span>
            </div>
            <div style={{height:5,borderRadius:9999,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:s.pct+'%',borderRadius:9999,background:s.color}}/></div>
          </div>)}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}><div style={{fontFamily:'Sora,sans-serif',fontSize:36,fontWeight:800,letterSpacing:'-0.04em',color:'var(--error)',marginBottom:4}}>$5,050</div><div style={{fontSize:12,color:'var(--text-3)'}}>Total Spent in May</div><div style={{fontSize:11,color:'var(--text-2)',marginTop:6}}>↑ 12% vs April</div></div>
        </div>
      </div>
    </div>
  </div>
}`,
'src/components/Transactions.tsx': `import { useState } from 'react'
const TX=[
  {id:1,name:'Whole Foods Market',cat:'Groceries',date:'Today, 2:15 PM',amount:-84.32,icon:'🛒',method:'Debit'},
  {id:2,name:'Salary — Acme Corp',cat:'Income',date:'Today, 9:00 AM',amount:8500.00,icon:'💰',method:'Direct Deposit'},
  {id:3,name:'Netflix',cat:'Streaming',date:'Yesterday',amount:-15.99,icon:'📺',method:'Credit'},
  {id:4,name:'Shell Gas Station',cat:'Transport',date:'May 28',amount:-65.40,icon:'⛽',method:'Debit'},
  {id:5,name:'Amazon',cat:'Shopping',date:'May 27',amount:-127.95,icon:'📦',method:'Credit'},
  {id:6,name:'Rent Payment',cat:'Housing',date:'May 25',amount:-2100.00,icon:'🏠',method:'Transfer'},
  {id:7,name:'Freelance Invoice #12',cat:'Income',date:'May 24',amount:2400.00,icon:'💻',method:'Wire'},
  {id:8,name:'Starbucks',cat:'Coffee',date:'May 23',amount:-7.40,icon:'☕',method:'Credit'},
]
export default function Transactions(){
  const [filter,setFilter]=useState('All')
  const filtered=filter==='All'?TX:filter==='Income'?TX.filter(t=>t.amount>0):TX.filter(t=>t.amount<0)
  return <div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em'}}>Transactions</h1>
      <div style={{display:'flex',gap:6}}>
        {['All','Income','Expenses'].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 12px',borderRadius:20,border:'1px solid var(--border)',background:filter===f?'var(--accent)':'transparent',color:filter===f?'#000':'var(--text-2)',fontSize:12,fontWeight:600,transition:'all 0.15s'}}>{f}</button>)}
      </div>
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
      {filtered.map((tx,i)=><div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',transition:'background 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
        <div style={{width:38,height:38,borderRadius:'var(--r)',background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{tx.icon}</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:1}}>{tx.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{tx.cat} · {tx.method} · {tx.date}</div></div>
        <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:tx.amount>0?'var(--success)':'var(--text)'}}>{tx.amount>0?'+':''}{'$'}{Math.abs(tx.amount).toFixed(2)}</div></div>
      </div>)}
    </div>
  </div>
}`,
'src/components/Transfer.tsx': `import { useState } from 'react'
export default function Transfer(){
  const [amount,setAmount]=useState('')
  const [from,setFrom]=useState('Checking ••••4821')
  const [to,setTo]=useState('')
  const [sent,setSent]=useState(false)
  if(sent) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:400,textAlign:'center'}}>
    <div style={{fontSize:56,marginBottom:16}}>✅</div>
    <h2 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,marginBottom:8}}>Transfer Sent!</h2>
    <p style={{color:'var(--text-2)',marginBottom:20}}>{'$'}{amount} successfully transferred</p>
    <button onClick={()=>{setSent(false);setAmount('');setTo('')}} style={{padding:'9px 24px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:600}}>New Transfer</button>
  </div>
  return <div style={{maxWidth:460,margin:'0 auto'}}>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:20}}>Transfer Money</h1>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24,display:'flex',flexDirection:'column',gap:16}}>
      <div style={{textAlign:'center',padding:'20px 0'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Amount</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
          <span style={{fontFamily:'Sora,sans-serif',fontSize:48,fontWeight:800,color:'var(--accent)'}}>$</span>
          <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00" style={{fontFamily:'Sora,sans-serif',fontSize:48,fontWeight:800,color:'var(--text)',background:'transparent',border:'none',outline:'none',width:200,textAlign:'center'}}/>
        </div>
        <div style={{fontSize:12,color:'var(--text-3)',marginTop:6}}>Available: $12,847.50</div>
      </div>
      {[['From',from,setFrom,['Checking ••••4821','Savings ••••7293']],['To',to,setTo,['Emma Wilson','James Park','Priya Patel','External Account']]].map(([label,val,onChange,opts])=><div key={label as string}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{label}</div>
        <select value={val as string} onChange={e=>(onChange as Function)(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:val?'var(--text)':'var(--text-3)',fontSize:13,outline:'none'}}>
          <option value="">Select account...</option>
          {(opts as string[]).map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      </div>)}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Note (optional)</div>
        <input placeholder="What's this for?" style={{width:'100%',padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'10px 0',borderTop:'1px solid var(--border)'}}>
        <span style={{color:'var(--text-2)'}}>Processing fee</span><span style={{color:'var(--success)',fontWeight:600}}>Free</span>
      </div>
      <button onClick={()=>{if(amount&&to)setSent(true)}} disabled={!amount||!to} style={{padding:'12px',borderRadius:'var(--r)',border:'none',background:amount&&to?'var(--accent)':'var(--elevated)',color:amount&&to?'#fff':'var(--text-3)',fontSize:14,fontWeight:700,transition:'all 0.15s',boxShadow:amount&&to?'0 4px 16px var(--accent-glow)':'none'}}>
        {amount&&to?'Send $'+amount:amount?'Select recipient':'Enter amount'}
      </button>
    </div>
  </div>
}`,
}
