export const REAL_ESTATE: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#f59e0b;--accent-2:#d97706;--accent-glow:rgba(245,158,11,0.2);--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{min-height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}a{color:inherit;text-decoration:none}`,
'src/App.tsx': `import { useState } from 'react'
import Navbar from './components/Navbar'
import PropertyGrid from './components/PropertyGrid'
import PropertyDetail from './components/PropertyDetail'
import './index.css'
export default function App(){
  const [selected,setSelected]=useState<number|null>(null)
  return <div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <Navbar/>
    {selected===null?<PropertyGrid onSelect={setSelected}/>:<PropertyDetail id={selected} onBack={()=>setSelected(null)}/>}
  </div>
}`,
'src/components/Navbar.tsx': `export default function Navbar(){
  return <nav style={{position:'sticky',top:0,zIndex:100,height:60,background:'rgba(9,9,11,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,4vw,48px)'}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🏠</div>
      <span style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:16,letterSpacing:'-0.04em'}}>EstateHub</span>
    </div>
    <div style={{display:'flex',gap:20}} className="hide-mobile">
      {['Buy','Rent','Sell','Agents','Blog'].map(l=><button key={l} style={{background:'none',border:'none',color:'var(--text-2)',fontSize:13,fontWeight:500,transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-2)'}>{l}</button>)}
    </div>
    <div style={{display:'flex',gap:8}}>
      <button style={{padding:'6px 14px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:13}}>Sign In</button>
      <button style={{padding:'6px 14px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#000',fontSize:13,fontWeight:700}}>List Property</button>
    </div>
    <style>{'.hide-mobile{display:flex}@media(max-width:768px){.hide-mobile{display:none}}'}</style>
  </nav>
}`,
'src/components/PropertyGrid.tsx': `import { useState } from 'react'
const PROPS=[
  {id:0,name:'Modern Downtown Penthouse',addr:'1234 Market St, San Francisco, CA',price:2850000,beds:3,baths:2.5,sqft:2100,type:'Buy',badge:'Featured',emoji:'🏙',tags:['Panoramic Views','Rooftop Deck','Concierge']},
  {id:1,name:'Cozy Marina District Condo',addr:'567 Marina Blvd, San Francisco, CA',price:4500,beds:2,baths:2,sqft:1100,type:'Rent',badge:'New',emoji:'🌊',tags:['Bay Views','Pet Friendly','Gym']},
  {id:2,name:'Victorian Noe Valley Townhouse',addr:'890 Castro St, San Francisco, CA',price:1950000,beds:4,baths:3,sqft:2800,type:'Buy',badge:'',emoji:'🏘',tags:['Historic Charm','Private Garden','Garage']},
  {id:3,name:'SoMa Tech Hub Loft',addr:'345 Brannan St, San Francisco, CA',price:3200,beds:1,baths:1,sqft:850,type:'Rent',badge:'',emoji:'🏗',tags:['Open Floor Plan','Smart Home','Rooftop']},
  {id:4,name:'Pacific Heights Estate',addr:'2341 Broadway, San Francisco, CA',price:5200000,beds:5,baths:4,sqft:4200,type:'Buy',badge:'Luxury',emoji:'🏰',tags:['Chef Kitchen','Wine Cellar','City Views']},
  {id:5,name:'Mission District Flat',addr:'678 Valencia St, San Francisco, CA',price:2800,beds:2,baths:1,sqft:950,type:'Rent',badge:'',emoji:'🌆',tags:['Hardwood Floors','In-unit Laundry','Near BART']},
]
export default function PropertyGrid({onSelect}:{onSelect:(id:number)=>void}){
  const [filter,setFilter]=useState('All')
  const [sort,setSort]=useState('Featured')
  const filtered=filter==='All'?PROPS:PROPS.filter(p=>p.type===filter)
  return <div style={{padding:'24px clamp(12px,4vw,48px)'}}>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 20px',marginBottom:24,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <input placeholder="City, neighborhood, or address..." style={{flex:1,minWidth:200,padding:'9px 14px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:14,outline:'none'}}/>
      <select style={{padding:'9px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}>
        <option>Any Type</option><option>House</option><option>Condo</option><option>Apartment</option>
      </select>
      <select style={{padding:'9px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:13,outline:'none'}}>
        <option>Any Price</option><option>Under $500k</option><option>$500k–$1M</option><option>$1M+</option>
      </select>
      <button style={{padding:'9px 20px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#000',fontSize:13,fontWeight:700}}>Search</button>
    </div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <div>
        <h1 style={{fontFamily:'Sora,sans-serif',fontSize:22,fontWeight:700,letterSpacing:'-0.03em',marginBottom:4}}>Homes in San Francisco</h1>
        <div style={{display:'flex',gap:8}}>
          {['All','Buy','Rent'].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:'4px 12px',borderRadius:20,border:'1px solid var(--border)',background:filter===f?'var(--accent)':'transparent',color:filter===f?'#000':'var(--text-2)',fontSize:12,fontWeight:600,transition:'all 0.15s'}}>{f}</button>)}
        </div>
      </div>
      <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:'6px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none'}}>
        <option>Featured</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Newest</option>
      </select>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
      {filtered.map(p=><div key={p.id} onClick={()=>onSelect(p.id)} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.borderColor='var(--accent)20'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}}>
        <div style={{height:180,background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:64,position:'relative'}}>
          {p.emoji}
          {p.badge&&<div style={{position:'absolute',top:10,left:10,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:p.badge==='Luxury'?'var(--accent)':p.badge==='Featured'?'#8b5cf6':'#10b981',color:p.badge==='Luxury'?'#000':'#fff'}}>{p.badge}</div>}
          <div style={{position:'absolute',top:10,right:10,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>♡</div>
        </div>
        <div style={{padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <h3 style={{fontSize:14,fontWeight:700,flex:1,marginRight:8}}>{p.name}</h3>
            <span style={{fontFamily:'Sora,sans-serif',fontSize:16,fontWeight:800,letterSpacing:'-0.03em',flexShrink:0,color:'var(--accent)'}}>{p.type==='Rent'?'$'+p.price+'/mo':'$'+(p.price/1000000).toFixed(1)+'M'}</span>
          </div>
          <div style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>📍 {p.addr}</div>
          <div style={{display:'flex',gap:12,marginBottom:10}}>
            {[p.beds+'bd',p.baths+'ba',p.sqft.toLocaleString()+' sqft'].map(s=><span key={s} style={{fontSize:12,color:'var(--text-2)',fontWeight:500}}>{s}</span>)}
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {p.tags.map(t=><span key={t} style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:'rgba(245,158,11,0.1)',color:'var(--accent)',fontWeight:600}}>{t}</span>)}
          </div>
        </div>
      </div>)}
    </div>
  </div>
}`,
'src/components/PropertyDetail.tsx': `const PROPS=[
  {id:0,name:'Modern Downtown Penthouse',addr:'1234 Market St, San Francisco, CA 94102',price:2850000,beds:3,baths:2.5,sqft:2100,type:'Buy',emoji:'🏙',desc:'Stunning penthouse in the heart of downtown with panoramic city and bay views. Features high-end finishes, chef\'s kitchen with Miele appliances, spa-like master bath, and private rooftop terrace. Building includes 24/7 concierge, fitness center, and valet parking.',amenities:['Panoramic Views','Chef Kitchen','Spa Bath','Rooftop Deck','Concierge 24/7','Valet Parking','Fitness Center','Wine Storage'],agent:{name:'Sarah Chen',agency:'Golden Gate Realty',phone:'+1 415 555 0123',since:'2016'}},
]
export default function PropertyDetail({id,onBack}:{id:number;onBack:()=>void}){
  const p=PROPS[0]
  const monthly=Math.round(p.price*0.0043)
  return <div style={{maxWidth:1100,margin:'0 auto',padding:'20px clamp(12px,4vw,48px)'}}>
    <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:13,marginBottom:20}}>← Back to listings</button>
    <div style={{height:360,background:'var(--elevated)',borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:96,marginBottom:20}}>{p.emoji}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
      <div>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
          <div><h1 style={{fontFamily:'Sora,sans-serif',fontSize:26,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4}}>{p.name}</h1><div style={{fontSize:13,color:'var(--text-2)'}}>📍 {p.addr}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:800,color:'var(--accent)',letterSpacing:'-0.04em'}}>{'$'}{(p.price/1000000).toFixed(2)}M</div><div style={{fontSize:12,color:'var(--text-3)'}}>Est. {'$'}{monthly.toLocaleString()}/mo</div></div>
        </div>
        <div style={{display:'flex',gap:20,padding:'14px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',marginBottom:20}}>
          {[['🛏',p.beds,'Bedrooms'],['🚿',p.baths,'Bathrooms'],['📐',p.sqft.toLocaleString(),'Sq Ft']].map(([icon,val,label])=><div key={label as string} style={{textAlign:'center'}}><div style={{fontSize:18,marginBottom:2}}>{icon}</div><div style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700}}>{val}</div><div style={{fontSize:11,color:'var(--text-3)'}}>{label}</div></div>)}
        </div>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:10}}>About this home</h2>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.7,marginBottom:20}}>{p.desc}</p>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:10}}>Amenities</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {p.amenities.map(a=><div key={a} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-2)'}}><span style={{color:'var(--accent)',fontSize:12,fontWeight:700}}>✓</span>{a}</div>)}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18}}>
          <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>👩</div>
            <div><div style={{fontSize:14,fontWeight:700}}>{p.agent.name}</div><div style={{fontSize:12,color:'var(--text-2)'}}>{p.agent.agency}</div><div style={{fontSize:11,color:'var(--text-3)'}}>Agent since {p.agent.since}</div></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button style={{padding:'10px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#000',fontSize:13,fontWeight:700}}>Schedule Tour</button>
            <button style={{padding:'10px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:13}}>Contact Agent</button>
            <div style={{fontSize:12,color:'var(--text-2)',textAlign:'center'}}>{p.agent.phone}</div>
          </div>
        </div>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Mortgage Calculator</div>
          {[['Home price','$'+p.price.toLocaleString()],['Down payment (20%)','$'+(p.price*0.2).toLocaleString()],['Loan amount','$'+(p.price*0.8).toLocaleString()],['Interest rate','6.8%'],['Monthly payment','$'+monthly.toLocaleString()]].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:'1px solid var(--border)'}}><span style={{color:'var(--text-2)'}}>{l}</span><span style={{fontWeight:v.startsWith('$'+monthly)?700:400,color:v.startsWith('$'+monthly)?'var(--accent)':'var(--text)'}}>{v}</span></div>)}
        </div>
      </div>
    </div>
  </div>
}`,
}
