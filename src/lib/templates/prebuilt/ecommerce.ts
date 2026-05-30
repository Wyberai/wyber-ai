export const ECOMMERCE: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--accent-2:#0284C7;--success:#22c55e;--r:8px;--r-lg:12px;--r-xl:16px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}
img{display:block}a{text-decoration:none;color:inherit}`,
'src/App.tsx': `import { useState } from 'react'
import Navbar from './components/Navbar'
import ProductGrid from './components/ProductGrid'
import Cart from './components/Cart'
import './index.css'
export type CartItem={id:number;name:string;price:number;qty:number;color:string}
export default function App(){
  const [cart,setCart]=useState<CartItem[]>([])
  const [showCart,setShowCart]=useState(false)
  const addToCart=(item:Omit<CartItem,'qty'>)=>{
    setCart(c=>{const ex=c.find(i=>i.id===item.id);return ex?c.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i):[...c,{...item,qty:1}]})
    setShowCart(true)
  }
  const count=cart.reduce((s,i)=>s+i.qty,0)
  return <div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <Navbar cartCount={count} onCartOpen={()=>setShowCart(true)}/>
    <ProductGrid onAdd={addToCart}/>
    {showCart&&<Cart items={cart} onClose={()=>setShowCart(false)} onUpdate={setCart}/>}
  </div>
}`,
'src/components/Navbar.tsx': `const CATS=['All','Electronics','Clothing','Home','Sports','Books']
export default function Navbar({cartCount,onCartOpen}:{cartCount:number;onCartOpen:()=>void}){
  return <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
    <div style={{maxWidth:1200,margin:'0 auto',padding:'0 20px',height:60,display:'flex',alignItems:'center',gap:20}}>
      <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:18,letterSpacing:'-0.04em',color:'var(--accent)',flexShrink:0}}>SHOP</div>
      <div style={{display:'flex',gap:16,flex:1}} className="hide-mobile">
        {CATS.map(c=><button key={c} style={{background:'none',border:'none',color:c==='All'?'var(--text)':'var(--text-2)',fontSize:13,fontWeight:c==='All'?600:400,padding:'4px 0',borderBottom:c==='All'?'2px solid var(--accent)':'2px solid transparent',transition:'all 0.15s'}}>{c}</button>)}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface)',borderRadius:'var(--r)',padding:'6px 12px',border:'1px solid var(--border)'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search products..." style={{border:'none',background:'transparent',color:'var(--text)',fontSize:12,outline:'none',width:160}}/>
        </div>
        <button onClick={onCartOpen} style={{position:'relative',width:38,height:38,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
          🛒{cartCount>0&&<span style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{cartCount}</span>}
        </button>
      </div>
    </div>
    <style>{'.hide-mobile{display:flex}@media(max-width:768px){.hide-mobile{display:none}}'}</style>
  </nav>
}`,
'src/components/ProductGrid.tsx': `import { useState } from 'react'
const PRODUCTS=[
  {id:1,name:'AirPods Pro Max',price:549,rating:4.8,reviews:2847,badge:'Best Seller',cat:'Electronics',colors:['#1a1a1a','#e5e7eb','#93c5fd']},
  {id:2,name:'Merino Wool Sweater',price:129,rating:4.6,reviews:891,badge:'',cat:'Clothing',colors:['#1a1a1a','#92400e','#1e3a5f']},
  {id:3,name:'Ceramic Pour-Over Set',price:89,rating:4.9,reviews:1203,badge:'New',cat:'Home',colors:['#f5f5f4','#1a1a1a']},
  {id:4,name:'Running Shoes Pro',price:189,rating:4.7,reviews:3421,badge:'Sale',cat:'Sports',colors:['#0EA5E9','#1a1a1a','#e5e7eb']},
  {id:5,name:'Mechanical Keyboard',price:249,rating:4.8,reviews:654,badge:'',cat:'Electronics',colors:['#1a1a1a','#f5f5f4']},
  {id:6,name:'Linen Trousers',price:79,rating:4.5,reviews:432,badge:'',cat:'Clothing',colors:['#d4c5a9','#1a1a1a','#6b7280']},
  {id:7,name:'Bamboo Desk Organizer',price:49,rating:4.7,reviews:987,badge:'',cat:'Home',colors:['#d2b48c','#1a1a1a']},
  {id:8,name:'Yoga Mat Premium',price:68,rating:4.6,reviews:2109,badge:'New',cat:'Sports',colors:['#10b981','#8b5cf6','#f59e0b']},
]
export default function ProductGrid({onAdd}:{onAdd:(item:any)=>void}){
  const [selected,setSelected]=useState<Record<number,number>>({})
  const [hover,setHover]=useState<number|null>(null)
  return <div style={{maxWidth:1200,margin:'0 auto',padding:'24px 20px'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <div><h1 style={{fontFamily:'Sora,sans-serif',fontSize:24,fontWeight:700,letterSpacing:'-0.03em',marginBottom:2}}>Featured Products</h1><p style={{fontSize:13,color:'var(--text-2)'}}>Showing {PRODUCTS.length} of 248 products</p></div>
      <select style={{padding:'7px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none'}}>
        <option>Sort: Featured</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Best Rated</option>
      </select>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
      {PRODUCTS.map(p=>{
        const selColor=selected[p.id]??0
        return <div key={p.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',overflow:'hidden',transition:'all 0.2s'}} onMouseEnter={()=>setHover(p.id)} onMouseLeave={()=>setHover(null)}>
          <div style={{height:200,background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
            <div style={{width:120,height:120,borderRadius:'50%',background:p.colors[selColor]+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
              {p.cat==='Electronics'?'🎧':p.cat==='Clothing'?'👕':p.cat==='Home'?'🏠':'⚽'}
            </div>
            {p.badge&&<div style={{position:'absolute',top:10,left:10,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:p.badge==='Sale'?'var(--error)':p.badge==='New'?'var(--success)':'var(--accent)',color:'#fff'}}>{p.badge}</div>}
            <button onClick={()=>onAdd({id:p.id,name:p.name,price:p.price,color:p.colors[selColor]})}
              style={{position:'absolute',bottom:10,left:'50%',transform:hover===p.id?'translateX(-50%) translateY(0)':'translateX(-50%) translateY(60px)',transition:'transform 0.2s',padding:'8px 20px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>
              Add to Cart
            </button>
          </div>
          <div style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:700,marginBottom:4}}>{p.name}</h3>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <div style={{display:'flex',gap:1}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:11,color:s<=Math.round(p.rating)?'#f59e0b':'var(--text-3)'}}>★</span>)}</div>
              <span style={{fontSize:11,color:'var(--text-2)'}}>{p.rating} ({p.reviews.toLocaleString()})</span>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              {p.colors.map((c,i)=><button key={i} onClick={()=>setSelected(s=>({...s,[p.id]:i}))} style={{width:18,height:18,borderRadius:'50%',background:c,border:selected[p.id]===i?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer'}}/>)}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,letterSpacing:'-0.03em'}}>{'$'}{p.price}</span>
              <button onClick={()=>onAdd({id:p.id,name:p.name,price:p.price,color:p.colors[selColor]})} style={{padding:'5px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:12,transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text)'}}>+ Cart</button>
            </div>
          </div>
        </div>
      })}
    </div>
  </div>
}`,
'src/components/Cart.tsx': `export type CartItem={id:number;name:string;price:number;qty:number;color:string}
export default function Cart({items,onClose,onUpdate}:{items:CartItem[];onClose:()=>void;onUpdate:(items:CartItem[])=>void}){
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0)
  const tax=subtotal*0.1
  const shipping=subtotal>100?0:12
  const update=(id:number,delta:number)=>onUpdate(items.map(i=>i.id===id?{...i,qty:Math.max(0,i.qty+delta)}:i).filter(i=>i.qty>0))
  return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:200}}/>
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:380,background:'var(--surface)',borderLeft:'1px solid var(--border)',zIndex:201,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2 style={{fontSize:16,fontWeight:700,letterSpacing:'-0.02em'}}>Cart ({items.reduce((s,i)=>s+i.qty,0)})</h2>
        <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-2)',fontSize:18}}>✕</button>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'12px 20px'}}>
        {items.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'var(--text-2)',fontSize:13}}>Your cart is empty</div>:items.map(item=><div key={item.id} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:56,height:56,borderRadius:'var(--r)',background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>🛍</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{item.name}</div>
            <div style={{fontSize:11,color:'var(--text-3)',display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:item.color}}/>Color
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>update(item.id,-1)} style={{width:24,height:24,borderRadius:6,border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:14}}>-</button>
                <span style={{fontSize:13,fontWeight:600,minWidth:16,textAlign:'center'}}>{item.qty}</span>
                <button onClick={()=>update(item.id,1)} style={{width:24,height:24,borderRadius:6,border:'1px solid var(--border)',background:'var(--elevated)',color:'var(--text)',fontSize:14}}>+</button>
              </div>
              <span style={{fontSize:14,fontWeight:700}}>{'$'}{(item.price*item.qty).toFixed(0)}</span>
            </div>
          </div>
        </div>)}
      </div>
      {items.length>0&&<div style={{padding:20,borderTop:'1px solid var(--border)'}}>
        {[['Subtotal',subtotal],['Shipping',shipping],['Tax (10%)',tax]].map(([l,v])=><div key={l as string} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}><span style={{color:'var(--text-2)'}}>{l}</span><span>{'$'}{(v as number).toFixed(2)}</span></div>)}
        <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,padding:'10px 0',borderTop:'1px solid var(--border)',marginTop:4,marginBottom:14}}>
          <span>Total</span><span>{'$'}{(subtotal+tax+shipping).toFixed(2)}</span>
        </div>
        <button style={{width:'100%',padding:'13px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,boxShadow:'0 4px 20px rgba(14,165,233,0.3)'}}>Checkout →</button>
      </div>}
    </div>
  </>
}`,
}
