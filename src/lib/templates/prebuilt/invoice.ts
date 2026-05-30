export const INVOICE: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--success:#22c55e;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button,input,select,textarea{font-family:inherit}`,
'src/App.tsx': `import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import './index.css'
export type LineItem={desc:string;qty:number;rate:number}
export type InvoiceData={number:string;date:string;due:string;from:{name:string;email:string;address:string};to:{name:string;email:string;address:string};items:LineItem[];tax:number;notes:string}
const DEFAULT:InvoiceData={number:'INV-0042',date:'2026-05-30',due:'2026-06-30',from:{name:'Alex Rodriguez',email:'alex@alexdev.io',address:'123 Design St\nSan Francisco, CA 94107'},to:{name:'Acme Corporation',email:'billing@acme.com',address:'456 Enterprise Ave\nNew York, NY 10001'},items:[{desc:'UI/UX Design — Dashboard Redesign',qty:1,rate:4800},{desc:'Frontend Development (React)',qty:40,rate:150},{desc:'Design System Documentation',qty:1,rate:800}],tax:10,notes:'Payment due within 30 days. Late payments subject to 1.5% monthly interest.\n\nThank you for your business!'}
export default function App(){
  const [data,setData]=useState<InvoiceData>(DEFAULT)
  const [preview,setPreview]=useState(false)
  return <div style={{minHeight:'100vh',padding:'24px clamp(12px,4vw,40px)'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div><h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:2}}>Invoice Generator</h1><p style={{fontSize:13,color:'var(--text-2)'}}>Create professional invoices in seconds</p></div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setPreview(p=>!p)} style={{padding:'7px 16px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:13,fontWeight:500}}>{preview?'Edit':'Preview'}</button>
          <button onClick={()=>window.print()} style={{padding:'7px 16px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600}}>Download PDF</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:preview?'1fr':'1fr 1fr',gap:16}}>
        {!preview&&<InvoiceForm data={data} onChange={setData}/>}
        <InvoicePreview data={data}/>
      </div>
    </div>
  </div>
}`,
'src/components/InvoiceForm.tsx': `import type { InvoiceData, LineItem } from '../App'
export default function InvoiceForm({data,onChange}:{data:InvoiceData;onChange:(d:InvoiceData)=>void}){
  const set=(path:string,val:any)=>{
    const d={...data}
    const keys=path.split('.')
    let obj:any=d
    for(let i=0;i<keys.length-1;i++)obj=obj[keys[i]]
    obj[keys[keys.length-1]]=val
    onChange(d)
  }
  const addItem=()=>onChange({...data,items:[...data.items,{desc:'',qty:1,rate:0}]})
  const removeItem=(i:number)=>onChange({...data,items:data.items.filter((_,j)=>j!==i)})
  const setItem=(i:number,k:keyof LineItem,v:any)=>onChange({...data,items:data.items.map((item,j)=>j===i?{...item,[k]:v}:item)})
  const inp=(val:string,onChange:(v:string)=>void,placeholder='')=><input value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/>
  const label=(t:string)=><div style={{fontSize:10,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{t}</div>
  return <div style={{display:'flex',flexDirection:'column',gap:12}}>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Invoice Details</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        <div>{label('Invoice #')}{inp(data.number,v=>set('number',v),'INV-0001')}</div>
        <div>{label('Issue Date')}<input type="date" value={data.date} onChange={e=>set('date',e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/></div>
        <div>{label('Due Date')}<input type="date" value={data.due} onChange={e=>set('due',e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/></div>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      {[{title:'Bill From',prefix:'from'},{title:'Bill To',prefix:'to'}].map(({title,prefix})=><div key={prefix} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>{title}</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div>{label('Name')}{inp((data as any)[prefix].name,v=>set(prefix+'.name',v),'Business name')}</div>
          <div>{label('Email')}{inp((data as any)[prefix].email,v=>set(prefix+'.email',v),'email@example.com')}</div>
          <div>{label('Address')}<textarea value={(data as any)[prefix].address} onChange={e=>set(prefix+'.address',e.target.value)} rows={2} style={{width:'100%',padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none',resize:'none'}}/></div>
        </div>
      </div>)}
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Line Items</div>
      {data.items.map((item,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8,alignItems:'center'}}>
        <input value={item.desc} onChange={e=>setItem(i,'desc',e.target.value)} placeholder="Description" style={{padding:'7px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:12,outline:'none'}}/>
        <input type="number" value={item.qty} onChange={e=>setItem(i,'qty',Number(e.target.value))} min={1} style={{padding:'7px 8px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:12,outline:'none',textAlign:'center'}}/>
        <input type="number" value={item.rate} onChange={e=>setItem(i,'rate',Number(e.target.value))} min={0} style={{padding:'7px 8px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:12,outline:'none',textAlign:'right'}}/>
        <button onClick={()=>removeItem(i)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'var(--r)',color:'var(--text-3)',fontSize:14,height:32,width:32}}>×</button>
      </div>)}
      <button onClick={addItem} style={{padding:'6px 14px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:12,marginTop:4}}>+ Add item</button>
      <div style={{marginTop:12,display:'flex',alignItems:'center',gap:8}}>
        {label('Tax %')}
        <input type="number" value={data.tax} onChange={e=>onChange({...data,tax:Number(e.target.value)})} style={{width:70,padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}/>
      </div>
    </div>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16}}>
      {label('Notes & Payment Terms')}
      <textarea value={data.notes} onChange={e=>onChange({...data,notes:e.target.value})} rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none',resize:'none',marginTop:4}}/>
    </div>
  </div>
}`,
'src/components/InvoicePreview.tsx': `import type { InvoiceData } from '../App'
export default function InvoicePreview({data}:{data:InvoiceData}){
  const subtotal=data.items.reduce((s,i)=>s+i.qty*i.rate,0)
  const taxAmt=subtotal*data.tax/100
  const total=subtotal+taxAmt
  const fmt=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'})
  return <div style={{background:'#fff',borderRadius:'var(--r-lg)',padding:40,color:'#111',fontFamily:'Space Grotesk,sans-serif'}}>
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:32}}>
      <div>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:800,letterSpacing:'-0.04em',color:'#0EA5E9',marginBottom:2}}>INVOICE</div>
        <div style={{fontSize:13,color:'#52525b'}}>#{data.number}</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{data.from.name}</div>
        <div style={{fontSize:12,color:'#6b7280',whiteSpace:'pre-line'}}>{data.from.address}</div>
        <div style={{fontSize:12,color:'#6b7280'}}>{data.from.email}</div>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:28,padding:16,background:'#f9fafb',borderRadius:8}}>
      <div><div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Bill To</div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{data.to.name}</div><div style={{fontSize:12,color:'#6b7280',whiteSpace:'pre-line'}}>{data.to.address}</div><div style={{fontSize:12,color:'#6b7280'}}>{data.to.email}</div></div>
      <div style={{textAlign:'right'}}>{[['Issue Date',data.date],['Due Date',data.due],['Status','Unpaid']].map(([l,v])=><div key={l} style={{marginBottom:6}}><div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em'}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:l==='Status'?'#ef4444':'#111'}}>{v}</div></div>)}</div>
    </div>
    <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,marginBottom:20}}>
      <thead><tr>{['Description','Qty','Rate','Amount'].map((h,i)=><th key={h} style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em',textAlign:i===0?'left':'right',borderBottom:'1px solid #e5e7eb',background:'#f9fafb'}}>{h}</th>)}</tr></thead>
      <tbody>{data.items.map((item,i)=><tr key={i}><td style={{padding:'10px',borderBottom:'1px solid #f3f4f6',fontSize:13}}>{item.desc}</td><td style={{padding:'10px',borderBottom:'1px solid #f3f4f6',fontSize:13,textAlign:'right'}}>{item.qty}</td><td style={{padding:'10px',borderBottom:'1px solid #f3f4f6',fontSize:13,textAlign:'right'}}>{fmt(item.rate)}</td><td style={{padding:'10px',borderBottom:'1px solid #f3f4f6',fontSize:13,fontWeight:600,textAlign:'right'}}>{fmt(item.qty*item.rate)}</td></tr>)}</tbody>
    </table>
    <div style={{display:'flex',justifyContent:'flex-end'}}>
      <div style={{width:220}}>
        {[['Subtotal',fmt(subtotal)],['Tax ('+data.tax+'%)',fmt(taxAmt)]].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}><span style={{color:'#6b7280'}}>{l}</span><span>{v}</span></div>)}
        <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:800,padding:'10px 0',borderTop:'2px solid #111',marginTop:6,color:'#0EA5E9'}}>
          <span>Total Due</span><span>{fmt(total)}</span>
        </div>
      </div>
    </div>
    {data.notes&&<div style={{marginTop:24,padding:14,background:'#f9fafb',borderRadius:8,fontSize:12,color:'#6b7280',lineHeight:1.6,whiteSpace:'pre-line'}}>{data.notes}</div>}
  </div>
}`,
}
