export const RESTAURANT: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#f97316;--accent-2:#ea580c;--success:#22c55e;--warning:#f59e0b;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`,
'src/App.tsx': `import { useState } from 'react'
import FloorPlan from './components/FloorPlan'
import OrderBoard from './components/OrderBoard'
import MenuManager from './components/MenuManager'
import './index.css'
const TABS=['Floor Plan','Active Orders','Menu']
export default function App(){
  const [tab,setTab]=useState('Floor Plan')
  return <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
    <header style={{height:54,background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🍽</div>
        <span style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:15,letterSpacing:'-0.03em'}}>Bistro Manager</span>
      </div>
      <div style={{display:'flex',gap:2,background:'var(--elevated)',padding:3,borderRadius:'var(--r)'}}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'5px 14px',borderRadius:6,border:'none',background:tab===t?'var(--surface)':'transparent',color:tab===t?'var(--text)':'var(--text-2)',fontSize:12,fontWeight:tab===t?600:400,transition:'all 0.15s'}}>{t}</button>)}
      </div>
      <div style={{fontSize:13,color:'var(--text-2)'}}>Fri, May 30 · Dinner Service</div>
    </header>
    <main style={{flex:1,overflow:'auto'}}>
      {tab==='Floor Plan'&&<FloorPlan/>}
      {tab==='Active Orders'&&<OrderBoard/>}
      {tab==='Menu'&&<MenuManager/>}
    </main>
  </div>
}`,
'src/components/FloorPlan.tsx': `import { useState } from 'react'
type TableStatus='available'|'seated'|'ordering'|'eating'|'bill'|'reserved'
const TABLES:{id:number;seats:number;status:TableStatus;guests?:number;server?:string;time?:string}[]=[
  {id:1,seats:2,status:'available'},{id:2,seats:4,status:'seated',guests:3,server:'Maria',time:'7:12 PM'},
  {id:3,seats:4,status:'eating',guests:4,server:'Jake',time:'6:45 PM'},{id:4,seats:6,status:'bill',guests:5,server:'Maria',time:'6:20 PM'},
  {id:5,seats:2,status:'available'},{id:6,seats:4,status:'reserved',guests:4,time:'8:00 PM'},
  {id:7,seats:8,status:'ordering',guests:6,server:'Sam',time:'7:30 PM'},{id:8,seats:2,status:'seated',guests:2,server:'Jake',time:'7:45 PM'},
  {id:9,seats:4,status:'available'},{id:10,seats:6,status:'eating',guests:4,server:'Sam',time:'6:55 PM'},
  {id:11,seats:4,status:'available'},{id:12,seats:2,status:'bill',guests:2,server:'Maria',time:'6:10 PM'},
]
const STATUS_CONFIG:Record<TableStatus,{bg:string;border:string;label:string;icon:string}>={
  available:{bg:'rgba(34,197,94,0.1)',border:'rgba(34,197,94,0.4)',label:'Available',icon:'✓'},
  seated:{bg:'rgba(14,165,233,0.1)',border:'rgba(14,165,233,0.4)',label:'Just Seated',icon:'👥'},
  ordering:{bg:'rgba(245,158,11,0.1)',border:'rgba(245,158,11,0.4)',label:'Ordering',icon:'📝'},
  eating:{bg:'rgba(139,92,246,0.1)',border:'rgba(139,92,246,0.4)',label:'Eating',icon:'🍽'},
  bill:{bg:'rgba(239,68,68,0.1)',border:'rgba(239,68,68,0.4)',label:'Needs Bill',icon:'💳'},
  reserved:{bg:'rgba(100,116,139,0.1)',border:'rgba(100,116,139,0.3)',label:'Reserved',icon:'🔒'},
}
const STATUS_COLORS:Record<TableStatus,string>={available:'#22c55e',seated:'#0EA5E9',ordering:'#f59e0b',eating:'#8b5cf6',bill:'#ef4444',reserved:'#64748b'}
export default function FloorPlan(){
  const [selected,setSelected]=useState<number|null>(null)
  const sel=selected!==null?TABLES.find(t=>t.id===selected):null
  const stats={available:TABLES.filter(t=>t.status==='available').length,occupied:TABLES.filter(t=>t.status!=='available'&&t.status!=='reserved').length,reserved:TABLES.filter(t=>t.status==='reserved').length}
  return <div style={{padding:20}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
      {[['Available',stats.available,'#22c55e'],['Occupied',stats.occupied,'#0EA5E9'],['Reserved',stats.reserved,'#64748b']].map(([l,v,c])=><div key={l as string} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:c as string}}/>
        <span style={{fontSize:13,color:'var(--text-2)'}}>{l}</span>
        <span style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,marginLeft:'auto'}}>{v}</span>
      </div>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:16}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:20}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Dining Room Floor Plan</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {TABLES.map(t=>{
            const cfg=STATUS_CONFIG[t.status]
            const isSelected=selected===t.id
            return <div key={t.id} onClick={()=>setSelected(t.id===selected?null:t.id)}
              style={{borderRadius:'var(--r)',border:'2px solid '+(isSelected?STATUS_COLORS[t.status]:cfg.border),background:cfg.bg,padding:10,cursor:'pointer',transition:'all 0.15s',boxShadow:isSelected?'0 0 12px '+STATUS_COLORS[t.status]+'40':'none'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:700,color:'var(--text-3)'}}>T{t.id}</span>
                <span style={{fontSize:14}}>{cfg.icon}</span>
              </div>
              <div style={{fontSize:10,fontWeight:700,color:STATUS_COLORS[t.status],marginBottom:3}}>{cfg.label}</div>
              <div style={{fontSize:10,color:'var(--text-3)'}}>{t.seats} seats</div>
              {t.guests&&<div style={{fontSize:10,color:'var(--text-2)',marginTop:2}}>{t.guests} guests</div>}
            </div>
          })}
        </div>
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        {sel?<>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Table {sel.id} Details</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['Status',STATUS_CONFIG[sel.status].label],['Seats',sel.seats],['Guests',sel.guests||'—'],['Server',sel.server||'—'],['Time',sel.time||'—']].map(([l,v])=><div key={l as string} style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--text-2)'}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>)}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:14}}>
            {sel.status==='available'&&<button style={{padding:'8px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>Seat Guests</button>}
            {sel.status==='bill'&&<button style={{padding:'8px',borderRadius:'var(--r)',border:'none',background:'var(--success)',color:'#fff',fontSize:12,fontWeight:600}}>Process Payment</button>}
            {sel.status!=='available'&&<button style={{padding:'8px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:12}}>View Order</button>}
          </div>
        </>:<div style={{textAlign:'center',paddingTop:40,color:'var(--text-3)',fontSize:13}}>Click a table to see details</div>}
        <div style={{marginTop:'auto',paddingTop:20,borderTop:'1px solid var(--border)',marginTop:20}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {Object.entries(STATUS_CONFIG).map(([k,v])=><div key={k} style={{display:'flex',alignItems:'center',gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:STATUS_COLORS[k as TableStatus]}}/>
              <span style={{fontSize:9,color:'var(--text-3)'}}>{v.label}</span>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </div>
}`,
'src/components/OrderBoard.tsx': `import { useState } from 'react'
type OrderStatus='new'|'preparing'|'ready'|'served'
const ORDERS:{id:string;table:number;server:string;items:string[];status:OrderStatus;time:string;elapsed:number}[]=[
  {id:'#042',table:3,server:'Jake',items:['Caesar Salad x2','Ribeye Steak x1','Tiramisu x2'],status:'ready',time:'6:47 PM',elapsed:18},
  {id:'#043',table:7,server:'Sam',items:['Bruschetta x3','Pasta Carbonara x2','Margherita Pizza x1','Red Wine'],status:'preparing',time:'7:31 PM',elapsed:9},
  {id:'#044',table:2,server:'Maria',items:['Soup du Jour x2','Grilled Salmon x1'],status:'new',time:'7:33 PM',elapsed:7},
  {id:'#045',table:8,server:'Jake',items:['Caprese Salad x1','Mushroom Risotto x2'],status:'preparing',time:'7:46 PM',elapsed:4},
]
const STATUS_NEXT:Record<OrderStatus,OrderStatus|null>={new:'preparing',preparing:'ready',ready:'served',served:null}
const STATUS_CONFIG:Record<OrderStatus,{color:string;bg:string;label:string}>={new:{color:'#0EA5E9',bg:'rgba(14,165,233,0.1)',label:'New'},preparing:{color:'#f59e0b',bg:'rgba(245,158,11,0.1)',label:'Preparing'},ready:{color:'#22c55e',bg:'rgba(34,197,94,0.1)',label:'Ready!'},served:{color:'#52525b',bg:'rgba(82,82,91,0.1)',label:'Served'}}
export default function OrderBoard(){
  const [orders,setOrders]=useState(ORDERS)
  const advance=(id:string)=>setOrders(os=>os.map(o=>o.id===id&&STATUS_NEXT[o.status]?{...o,status:STATUS_NEXT[o.status]!}:o))
  const active=orders.filter(o=>o.status!=='served')
  return <div style={{padding:20}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <h1 style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,letterSpacing:'-0.03em'}}>Active Orders</h1>
      <div style={{fontSize:13,color:'var(--text-2)'}}>{active.length} orders in progress</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
      {orders.map(o=>{
        const cfg=STATUS_CONFIG[o.status]
        return <div key={o.id} style={{background:'var(--surface)',border:'1px solid '+cfg.color+'30',borderRadius:'var(--r-lg)',padding:14,borderLeft:'3px solid '+cfg.color}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div><span style={{fontSize:14,fontWeight:700}}>{o.id}</span><span style={{fontSize:12,color:'var(--text-3)',marginLeft:6}}>Table {o.table}</span></div>
            <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:9999,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <span style={{fontSize:11,color:'var(--text-3)'}}>👤 {o.server}</span>
            <span style={{fontSize:11,color:'var(--text-3)'}}>🕐 {o.time}</span>
            <span style={{fontSize:11,fontWeight:600,color:o.elapsed>15?'var(--error)':o.elapsed>10?'var(--warning)':'var(--text-3)',marginLeft:'auto'}}>{o.elapsed}m ago</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:12}}>
            {o.items.map((item,i)=><div key={i} style={{fontSize:12,color:'var(--text-2)',display:'flex',alignItems:'center',gap:6}}><span style={{color:'var(--accent)',fontSize:10}}>▸</span>{item}</div>)}
          </div>
          {STATUS_NEXT[o.status]&&<button onClick={()=>advance(o.id)} style={{width:'100%',padding:'7px',borderRadius:'var(--r)',border:'none',background:cfg.color,color:o.status==='ready'?'#fff':'#000',fontSize:12,fontWeight:700}}>
            Mark as {STATUS_NEXT[o.status]==='preparing'?'Preparing':STATUS_NEXT[o.status]==='ready'?'Ready':'Served'}
          </button>}
        </div>
      })}
    </div>
  </div>
}`,
'src/components/MenuManager.tsx': `import { useState } from 'react'
const MENU={Starters:[{name:'Bruschetta al Pomodoro',price:12,available:true,desc:'Grilled bread with fresh tomatoes and basil'},{name:'Caprese Salad',price:14,available:true,desc:'Buffalo mozzarella, heirloom tomatoes, basil oil'},{name:'Soup du Jour',price:10,available:false,desc:'Ask your server for today\'s selection'}],Mains:[{name:'Pasta Carbonara',price:26,available:true,desc:'House-made tagliatelle, guanciale, pecorino'},{name:'Grilled Salmon',price:34,available:true,desc:'Atlantic salmon, lemon caper butter, seasonal veg'},{name:'Ribeye Steak',price:52,available:true,desc:'12oz dry-aged, truffle fries, bordelaise'},{name:'Mushroom Risotto',price:24,available:true,desc:'Arborio, wild mushrooms, parmesan, truffle oil'}],Desserts:[{name:'Tiramisu',price:10,available:true,desc:'Classic Italian, Kahlua, mascarpone'},{name:'Panna Cotta',price:9,available:true,desc:'Vanilla bean, seasonal berry coulis'}]}
export default function MenuManager(){
  const [avail,setAvail]=useState<Record<string,boolean>>(Object.fromEntries(Object.values(MENU).flat().map(i=>[i.name,i.available])))
  return <div style={{padding:20}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <h1 style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,letterSpacing:'-0.03em'}}>Menu Management</h1>
      <button style={{padding:'7px 14px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600}}>+ Add Item</button>
    </div>
    {Object.entries(MENU).map(([cat,items])=><div key={cat} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:12}}>
      <div style={{padding:'11px 14px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>{cat}</span><span style={{color:'var(--text-3)',fontWeight:400}}>{items.length} items</span>
      </div>
      {items.map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderBottom:i<items.length-1?'1px solid var(--border)':'none',opacity:avail[item.name]?1:0.5}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{item.name}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{item.desc}</div></div>
        <div style={{fontSize:14,fontWeight:700,color:'var(--text-2)'}}>{'$'}{item.price}</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:9999,background:avail[item.name]?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',color:avail[item.name]?'var(--success)':'var(--error)'}}>{avail[item.name]?'Available':'86\'d'}</span>
          <button onClick={()=>setAvail(a=>({...a,[item.name]:!a[item.name]}))} style={{padding:'3px 9px',borderRadius:5,border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:11}}>{avail[item.name]?'86 it':'Restore'}</button>
          <button style={{padding:'3px 9px',borderRadius:5,border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:11}}>Edit</button>
        </div>
      </div>)}
    </div>)}
  </div>
}`,
}
