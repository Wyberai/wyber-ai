export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG, TOKEN_VARS_CSS } from '@/lib/design-system'
import { WYBER_BRIDGE_SCRIPT, injectWyberLoc } from '@/lib/wyber-preview/bridge'
import { WYBER_UI_KIT_FILES } from '@/lib/wyber-ui-kit'
import { WYBER_STORE_FILES } from '@/lib/wyber-store'
import { resolveDirectivesForPreview } from '@/lib/image-directives'

const EXTERNAL_DEPS: Record<string, string> = {
  'react':              'https://esm.sh/react@18.3.1',
  'react-dom':          'https://esm.sh/react-dom@18.3.1',
  'react-dom/client':   'https://esm.sh/react-dom@18.3.1/client',
  'react/jsx-runtime':  'https://esm.sh/react@18.3.1/jsx-runtime',
  'lucide-react':       'https://esm.sh/lucide-react@0.383.0',
  'recharts':           'https://esm.sh/recharts@2.12.0',
  'clsx':               'https://esm.sh/clsx@2.1.1',
  'react-router-dom':   'https://esm.sh/react-router-dom@6.28.0',
  'framer-motion':      'https://esm.sh/framer-motion@11.0.0',
  'date-fns':           'https://esm.sh/date-fns@3.6.0',
  'zustand':            'https://esm.sh/zustand@4.5.2',
  'axios':              'https://esm.sh/axios@1.7.2',
  'gsap':               'https://esm.sh/gsap@3.12.5',
  'gsap/ScrollTrigger': 'https://esm.sh/gsap@3.12.5/ScrollTrigger',
  'lenis':              'https://esm.sh/lenis@1.1.14',
}

// Only normalises the leading slash. Deliberately does NOT append a default
// extension: it's called both to register real files (which already carry
// their actual extension, e.g. 'src/wyber-store.ts') and to resolve import
// specifiers (which usually don't). Forcing '.tsx' here for an extensionless
// import ran ahead of the onResolve `tries` fallback below and pre-committed
// every extensionless import to '.tsx' before '.ts'/'.js'/index.* ever got a
// chance — silently breaking any import of a real '.ts' module (wyber-store
// is 'src/wyber-store.ts', so `import ... from './wyber-store'` resolved to
// the wrong, nonexistent 'wyber-store.tsx' and fell through to being treated
// as an external esm.sh package instead, producing an unresolvable URL that
// took down the whole bundle before React ever mounted).
function normalise(p: string): string {
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function resolveImport(from: string, to: string): string {
  if (to.startsWith('/')) return normalise(to)
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.') out.push(p)
  }
  return normalise(out.join('/'))
}

function getLoader(p: string): 'tsx' | 'ts' | 'css' | 'json' | 'js' {
  if (p.endsWith('.css')) return 'css'
  if (p.endsWith('.json')) return 'json'
  if (p.endsWith('.ts')) return 'ts'
  if (p.endsWith('.js')) return 'js'
  return 'tsx'
}

async function bundleAndHtml(
  rawFiles: Record<string, string>,
  projectId: string,
): Promise<{ html: string; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const esbuild = require('esbuild')

  const tagged = injectWyberLoc(rawFiles)

  const files: Record<string, string> = {}
  for (const [path, content] of Object.entries(tagged)) {
    files[normalise(path)] = resolveDirectivesForPreview(content)
  }

  // Inject UI kit + store
  for (const [p, c] of Object.entries(WYBER_UI_KIT_FILES)) {
    const n = normalise(p); if (!files[n]) files[n] = c
  }
  for (const [p, c] of Object.entries(WYBER_STORE_FILES)) {
    const n = normalise(p); if (!files[n]) files[n] = c
  }

  // Find app entry
  const candidates = ['/src/App.tsx', '/App.tsx', '/src/index.tsx', '/index.tsx', '/src/main.tsx']
  const appEntry = candidates.find(c => files[c]) || Object.keys(files).find(k => k.endsWith('.tsx')) || ''
  if (!appEntry) return { html: errorHtml('No App entry point found', projectId), error: 'No App entry point found' }

  // Boot module: imports App and mounts it to #root.
  // This is the real entry point for esbuild — the output bundle will have
  // external imports (react, react-dom) at the TOP LEVEL of the ESM output,
  // which is valid inside a <script type="module">. We do NOT wrap them in
  // try/catch (that's a SyntaxError for static import declarations).
  const BOOT = '/__wyber_boot.tsx'
  files[BOOT] = `
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import App from '${appEntry}'
const el = document.getElementById('root')
if (el) createRoot(el).render(createElement(App))
`

  let collectedCSS = ''

  let result: { errors?: {text: string; location?: {file: string; line: number}}[]; outputFiles?: {text: string}[] }
  try {
    result = await esbuild.build({
      entryPoints: [BOOT],
      bundle: true,
      format: 'esm',
      write: false,
      minify: false,
      treeShaking: true,
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.js': 'js', '.jsx': 'jsx', '.css': 'css', '.json': 'json' },
      define: { 'process.env.NODE_ENV': '"development"' },
      plugins: [
        {
          name: 'wyber-virtual',
          setup(build: {
            onResolve: (o: {filter: RegExp}, cb: (a: {path: string; importer: string}) => unknown) => void
            onLoad: (o: {filter: RegExp; namespace: string}, cb: (a: {path: string}) => unknown) => void
          }) {
            build.onResolve({ filter: /.*/ }, args => {
              if (EXTERNAL_DEPS[args.path]) return { path: args.path, external: true }
              for (const ext of Object.keys(EXTERNAL_DEPS)) {
                if (args.path.startsWith(ext + '/')) return { path: args.path, external: true }
              }
              let resolved: string
              if (args.path.startsWith('@/')) {
                resolved = normalise('/src/' + args.path.slice(2))
              } else if (args.path.startsWith('.') || args.path.startsWith('/')) {
                resolved = args.importer ? resolveImport(args.importer, args.path) : normalise(args.path)
              } else {
                resolved = '/' + args.path
              }
              const tries = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.js', resolved + '/index.tsx', resolved + '/index.ts']
              for (const p of tries) { if (files[p]) return { path: p, namespace: 'wyber' } }
              return { path: `https://esm.sh/${args.path}`, external: true }
            })
            build.onLoad({ filter: /.*/, namespace: 'wyber' }, args => {
              const content = files[args.path]
              if (!content) return { errors: [{ text: `File not found: ${args.path}` }] }
              const l = getLoader(args.path)
              if (l === 'css') { collectedCSS += content + '\n'; return { contents: '', loader: 'js' } }
              return { contents: content, loader: l }
            })
          },
        },
      ],
      external: Object.keys(EXTERNAL_DEPS),
    })
  } catch (err) {
    const msg = String(err)
    return { html: errorHtml(msg, projectId), error: msg }
  }

  if (result.errors && result.errors.length > 0) {
    const msg = result.errors.map(e => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`).join('\n')
    return { html: errorHtml(msg, projectId), error: msg }
  }

  for (const [p, c] of Object.entries(files)) {
    if (p.endsWith('.css') && !collectedCSS.includes(c.slice(0, 40))) collectedCSS += c + '\n'
  }

  const js = result.outputFiles?.[0]?.text || ''
  return { html: generateHtml(js, collectedCSS, projectId) }
}

function generateHtml(js: string, css: string, projectId: string): string {
  const importmap = JSON.stringify({ imports: EXTERNAL_DEPS })
  // Two separate script blocks:
  //   1. Regular <script>: sets up error display + global handlers BEFORE the
  //      module loads. Runs synchronously so it's ready when the module fires.
  //   2. <script type="module">: the ESM bundle. Top-level import declarations
  //      sit at the module's top level — valid JS, no try/catch wrapper needed.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wyber Preview</title>
  ${GOOGLE_FONTS_LINKS}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG};</script>
  <script type="importmap">${importmap}</script>
  <style>
    ${TOKEN_VARS_CSS}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
    body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-family: var(--font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif); -webkit-font-smoothing: antialiased; }
    @keyframes wSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes wFadeIn  { from { opacity: 0; }                 to { opacity: 1; }              }
  </style>
  <style id="app-styles">${css}</style>
</head>
<body>
  <div id="root"></div>
  <div id="wyber-error" style="display:none;position:fixed;inset:0;background:#09090b;color:#ef4444;font-family:monospace;padding:24px;font-size:13px;overflow:auto;z-index:9999;white-space:pre-wrap;"></div>
  <script>
    window.__WYBER_PROJECT_ID__ = '${projectId}';
    function showError(msg) {
      var el = document.getElementById('wyber-error');
      if (el) { el.style.display = 'block'; el.textContent = '\\u26a0 Preview Error\\n\\n' + String(msg); }
      console.error('[WyberPreview]', msg);
    }
    window.addEventListener('error', function(e) { showError(e.message + (e.filename ? '\\n' + e.filename + ':' + e.lineno : '')); });
    window.addEventListener('unhandledrejection', function(e) { showError(String(e.reason)); });
  </script>
  <script type="module">
${js}
  </script>
  ${WYBER_BRIDGE_SCRIPT}
</body>
</html>`
}

function errorHtml(error: string, projectId: string): string {
  const safe = error.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{background:#09090b;color:#ef4444;font-family:monospace;padding:24px;font-size:13px;white-space:pre-wrap;overflow:auto;}
h2{color:#fca5a5;margin-bottom:12px;font-size:14px;}
</style></head><body><h2>&#9888; Build Error</h2>${safe}
${WYBER_BRIDGE_SCRIPT}
</body></html>`
}

const ASTEROIDS_APP = `
import { useEffect, useRef } from 'react'
const TAU = Math.PI * 2
const rnd = (a, b) => a + Math.random() * (b - a)
const rndi = (a, b) => Math.floor(rnd(a, b + 1))
function mkRock(x, y, size) {
  const r = size === 3 ? 52 : size === 2 ? 28 : 14
  const speed = rnd(0.5, 1.8) * (4 - size)
  const ang = rnd(0, TAU)
  const n = rndi(8, 13)
  return { x, y, vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed, r, size, rot: 0, spin: rnd(-0.025, 0.025), verts: Array.from({length:n}, () => rnd(0.65, 1.0)) }
}
function wrap(o, W, H) {
  if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r
  if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r
}
export default function App() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    canvas.width = 800; canvas.height = 600
    const ctx = canvas.getContext('2d')
    const W = 800, H = 600
    let player = { x: W/2, y: H/2, vx: 0, vy: 0, angle: -Math.PI/2, r: 14 }
    let bullets = [], rocks = [], particles = []
    let lives = 3, score = 0, level = 1, hiScore = 0, invincible = 0, shotCd = 0
    let state = 'menu'
    const keys = {}
    const spawnLevel = () => {
      rocks = []
      for (let i = 0; i < level + 3; i++) {
        let ax, ay
        do { ax = rnd(0, W); ay = rnd(0, H) }
        while (Math.hypot(ax - player.x, ay - player.y) < 180)
        rocks.push(mkRock(ax, ay, 3))
      }
    }
    const explode = (x, y, color, n) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, TAU), s = rnd(1.5, 5)
        particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: rnd(0.6, 1.2), color, sz: rnd(1.5, 3.5) })
      }
    }
    const resetPlayer = () => {
      player = { x: W/2, y: H/2, vx: 0, vy: 0, angle: -Math.PI/2, r: 14 }
      invincible = 200
    }
    const drawShip = (x, y, angle, alpha) => {
      ctx.save()
      ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha
      ctx.shadowBlur = 14; ctx.shadowColor = '#6ee7f7'
      ctx.strokeStyle = '#6ee7f7'; ctx.lineWidth = 2
      ctx.fillStyle = 'rgba(110,231,247,0.07)'
      ctx.beginPath(); ctx.moveTo(22,0); ctx.lineTo(-14,-11); ctx.lineTo(-8,0); ctx.lineTo(-14,11); ctx.closePath()
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore()
    }
    const drawRock = a => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot)
      const col = a.size===3?'#8888aa':a.size===2?'#aaaacc':'#ccccee'
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = col
      ctx.beginPath()
      const n = a.verts.length
      for (let i = 0; i < n; i++) {
        const ang = (i/n)*TAU, rv = a.r*a.verts[i]
        i===0 ? ctx.moveTo(Math.cos(ang)*rv, Math.sin(ang)*rv) : ctx.lineTo(Math.cos(ang)*rv, Math.sin(ang)*rv)
      }
      ctx.closePath(); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore()
    }
    const kd = e => { keys[e.key] = true; e.preventDefault() }
    const ku = e => { keys[e.key] = false }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku)
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      ctx.fillStyle = '#000010'; ctx.fillRect(0, 0, W, H)
      for (let i = 0; i < 80; i++) {
        const sx = (i*137.5)%W, sy = (i*97.3+i*53.1)%H
        ctx.globalAlpha = 0.2 + (i%3)*0.2
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sx, sy, i%3===0?1.5:1, i%3===0?1.5:1)
      }
      ctx.globalAlpha = 1
      if (state === 'menu' || state === 'over') {
        ctx.textAlign = 'center'
        ctx.shadowBlur = 22; ctx.shadowColor = '#6366f1'
        ctx.fillStyle = '#a5b4fc'; ctx.font = 'bold 56px monospace'
        ctx.fillText('ASTEROIDS', W/2, H/2 - 50)
        ctx.shadowBlur = 0
        if (state === 'over') {
          ctx.fillStyle = '#ef4444'; ctx.font = 'bold 26px monospace'
          ctx.fillText('GAME OVER', W/2, H/2 - 110)
          ctx.fillStyle = '#777'; ctx.font = '15px monospace'
          ctx.fillText('Score: ' + score + '   Hi: ' + hiScore, W/2, H/2 + 85)
        }
        ctx.fillStyle = '#555'; ctx.font = '13px monospace'
        ctx.fillText('WASD / Arrows to thrust & turn   SPACE to fire', W/2, H/2 + 5)
        ctx.fillStyle = '#6ee7f7'; ctx.font = 'bold 16px monospace'
        ctx.fillText('Press SPACE to play', W/2, H/2 + 45)
        if (keys[' ']) { state='playing'; score=0; lives=3; level=1; resetPlayer(); spawnLevel(); keys[' ']=false }
        return
      }
      if (state === 'dead') {
        ctx.textAlign = 'center'
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 32px monospace'
        ctx.fillText('SHIP DESTROYED', W/2, H/2)
        ctx.fillStyle = '#777'; ctx.font = '13px monospace'
        ctx.fillText('SPACE to respawn  (' + lives + ' lives left)', W/2, H/2 + 36)
        if (keys[' ']) {
          keys[' '] = false
          if (lives > 0) { state='playing'; resetPlayer() }
          else { state='over'; hiScore = Math.max(hiScore, score) }
        }
        return
      }
      if (invincible > 0) invincible--
      if (shotCd > 0) shotCd--
      if (keys['ArrowLeft']||keys['a']) player.angle -= 0.06
      if (keys['ArrowRight']||keys['d']) player.angle += 0.06
      if (keys['ArrowUp']||keys['w']) {
        player.vx += Math.cos(player.angle)*0.22; player.vy += Math.sin(player.angle)*0.22
        if (Math.random()<0.5) {
          const ea = player.angle + Math.PI + rnd(-0.5,0.5)
          particles.push({ x:player.x-Math.cos(player.angle)*14, y:player.y-Math.sin(player.angle)*14, vx:Math.cos(ea)*rnd(1,3), vy:Math.sin(ea)*rnd(1,3), life:rnd(0.2,0.5), color:Math.random()>0.5?'#f97316':'#fbbf24', sz:rnd(1,2.5) })
        }
      }
      player.vx *= 0.988; player.vy *= 0.988
      player.x += player.vx; player.y += player.vy; wrap(player, W, H)
      if (keys[' '] && shotCd===0) {
        bullets.push({ x:player.x+Math.cos(player.angle)*22, y:player.y+Math.sin(player.angle)*22, vx:player.vx+Math.cos(player.angle)*9, vy:player.vy+Math.sin(player.angle)*9, life:1.1 })
        shotCd = 10
      }
      bullets = bullets.filter(b => {
        b.x+=b.vx; b.y+=b.vy; b.life-=0.011; wrap(b,W,H)
        ctx.beginPath(); ctx.arc(b.x,b.y,2.5,0,TAU)
        ctx.fillStyle='#ffe033'; ctx.shadowBlur=8; ctx.shadowColor='#ffe033'; ctx.fill(); ctx.shadowBlur=0
        return b.life>0
      })
      for (const a of rocks) { a.x+=a.vx; a.y+=a.vy; a.rot+=a.spin; wrap(a,W,H); drawRock(a) }
      const newRocks = []
      bullets = bullets.filter(b => {
        for (let i = rocks.length-1; i >= 0; i--) {
          const a = rocks[i]
          if (Math.hypot(b.x-a.x, b.y-a.y) < a.r+2) {
            score += [50,25,10][3-a.size]
            explode(a.x, a.y, a.size===3?'#8888aa':'#aaaacc', 10+a.size*4)
            if (a.size>1) {
              newRocks.push(mkRock(a.x+rnd(-15,15),a.y+rnd(-15,15),a.size-1))
              newRocks.push(mkRock(a.x+rnd(-15,15),a.y+rnd(-15,15),a.size-1))
            }
            rocks.splice(i,1); return false
          }
        }
        return true
      })
      rocks.push(...newRocks)
      if (invincible===0) {
        for (const a of rocks) {
          if (Math.hypot(player.x-a.x,player.y-a.y) < a.r+player.r-6) {
            explode(player.x,player.y,'#6ee7f7',24); lives--; state='dead'; keys[' ']=false; break
          }
        }
      }
      if (rocks.length===0) { level++; score+=level*100; spawnLevel(); explode(W/2,H/2,'#6366f1',30) }
      ctx.save()
      particles = particles.filter(p => {
        p.x+=p.vx*0.95; p.y+=p.vy*0.95; p.life-=0.018
        ctx.globalAlpha = Math.max(0, p.life*0.9)
        ctx.fillStyle = p.color; ctx.shadowBlur=4; ctx.shadowColor=p.color
        ctx.fillRect(p.x-p.sz/2, p.y-p.sz/2, p.sz, p.sz)
        return p.life>0
      })
      ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.restore()
      const alpha = invincible>0 ? (Math.sin(invincible*0.25)*0.45+0.55) : 1
      drawShip(player.x, player.y, player.angle, alpha)
      ctx.textAlign='left'; ctx.fillStyle='#a5b4fc'; ctx.font='bold 14px monospace'
      ctx.fillText('SCORE  '+score, 14, 28)
      ctx.textAlign='right'; ctx.fillStyle='#6ee7f7'
      ctx.fillText('LEVEL '+level, W-14, 28)
      ctx.textAlign='center'
      for (let i=0;i<lives;i++) {
        ctx.save(); ctx.translate(W/2-(lives-1)*18+i*36, 22); ctx.rotate(-Math.PI/2)
        ctx.strokeStyle='#6ee7f7'; ctx.lineWidth=1.5
        ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-6,-6); ctx.lineTo(-4,0); ctx.lineTo(-6,6); ctx.closePath(); ctx.stroke()
        ctx.restore()
      }
    }
    loop()
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku) }
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100vh',background:'#000010',overflow:'hidden'}}>
      <canvas ref={ref} style={{display:'block'}} />
    </div>
  )
}`

const FOCUSFLOW_FILES: Record<string, string> = {
  'src/App.tsx': `
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Timer, CheckSquare, BarChart2, Settings, Zap } from 'lucide-react'
import TimerView from './components/TimerView'
import TasksView from './components/TasksView'
import StatsView from './components/StatsView'
import SettingsView from './components/SettingsView'
type Tab = 'timer'|'tasks'|'stats'|'settings'
const TABS = [
  {id:'timer',label:'Timer',Icon:Timer},
  {id:'tasks',label:'Tasks',Icon:CheckSquare},
  {id:'stats',label:'Stats',Icon:BarChart2},
  {id:'settings',label:'Settings',Icon:Settings},
]
export default function App() {
  const [tab, setTab] = useState<Tab>('timer')
  const views: Record<Tab,any> = { timer:<TimerView/>, tasks:<TasksView/>, stats:<StatsView/>, settings:<SettingsView/> }
  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',color:'#e2e8f0',fontFamily:'Inter,system-ui,sans-serif',display:'flex',flexDirection:'column'}}>
      <header style={{borderBottom:'1px solid #1c1c28',padding:'12px 24px',display:'flex',alignItems:'center',gap:8}}>
        <Zap size={20} color="#6366f1" />
        <span style={{fontWeight:700,fontSize:16,color:'#6366f1'}}>FocusFlow</span>
        <span style={{marginLeft:'auto',fontSize:11,color:'#333',letterSpacing:1}}>POMODORO TIMER</span>
      </header>
      <nav style={{borderBottom:'1px solid #1c1c28',padding:'0 24px',display:'flex',gap:0}}>
        {TABS.map(t => {
          const Icon = t.Icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={()=>setTab(t.id as Tab)}
              style={{display:'flex',alignItems:'center',gap:6,padding:'12px 16px',border:'none',borderBottom:active?'2px solid #6366f1':'2px solid transparent',background:'transparent',color:active?'#6366f1':'#555',cursor:'pointer',fontSize:13,fontWeight:active?600:400,transition:'color 0.15s'}}>
              <Icon size={14}/>{t.label}
            </button>
          )
        })}
      </nav>
      <main style={{flex:1}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}}>
            {views[tab]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}`,
  'src/store/store.tsx': `
import { create } from 'zustand'
export type Priority = 'high'|'medium'|'low'
export type Task = {id:string;title:string;done:boolean;priority:Priority}
export type DayStat = {day:string;sessions:number}
interface Store {
  sessions:number; workMins:number; breakMins:number
  tasks:Task[]; history:DayStat[]
  addSession:()=>void
  addTask:(title:string,priority:Priority)=>void
  toggleTask:(id:string)=>void
  deleteTask:(id:string)=>void
  updateSettings:(s:{workMins?:number;breakMins?:number})=>void
}
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const rn = (n:number) => Math.floor(Math.random()*n)
export const useStore = create<Store>((set)=>({
  sessions:0, workMins:25, breakMins:5,
  tasks:[
    {id:'1',title:'Design onboarding flow',done:true,priority:'high'},
    {id:'2',title:'Write API documentation',done:false,priority:'medium'},
    {id:'3',title:'Fix auth bug in login',done:false,priority:'high'},
    {id:'4',title:'Refactor UI components',done:true,priority:'low'},
    {id:'5',title:'Deploy to production',done:false,priority:'medium'},
    {id:'6',title:'Add dark mode toggle',done:false,priority:'low'},
  ],
  history: DAYS.map((day,i)=>({day, sessions:i<6?rn(7)+1:0})),
  addSession: ()=>set(s=>({sessions:s.sessions+1,history:s.history.map((h,i)=>i===s.history.length-1?{...h,sessions:h.sessions+1}:h)})),
  addTask: (title,priority)=>set(s=>({tasks:[...s.tasks,{id:String(Date.now()),title,done:false,priority}]})),
  toggleTask: (id)=>set(s=>({tasks:s.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)})),
  deleteTask: (id)=>set(s=>({tasks:s.tasks.filter(t=>t.id!==id)})),
  updateSettings: (settings)=>set(settings),
}))`,
  'src/components/TimerView.tsx': `
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react'
import { useStore } from '../store/store'
const R = 90, CIRC = 2 * Math.PI * R
export default function TimerView() {
  const { workMins, breakMins, addSession } = useStore()
  const [mode, setMode] = useState<'work'|'break'>('work')
  const [total, setTotal] = useState(workMins*60)
  const [left, setLeft] = useState(workMins*60)
  const [running, setRunning] = useState(false)
  const iRef = useRef<number|null>(null)
  const elapsed = total - left
  const dashOffset = CIRC * (elapsed / total)
  const mins = Math.floor(left/60), secs = left%60
  const color = mode==='work'?'#6366f1':'#22c55e'
  const switchMode = (m:'work'|'break') => {
    setRunning(false); if(iRef.current) clearInterval(iRef.current)
    setMode(m); const t=(m==='work'?workMins:breakMins)*60; setTotal(t); setLeft(t)
  }
  useEffect(()=>{
    if(running){
      iRef.current = window.setInterval(()=>{
        setLeft(l=>{
          if(l<=1){ setRunning(false); clearInterval(iRef.current!); if(mode==='work') addSession(); return 0 }
          return l-1
        })
      },1000)
    }
    return ()=>{ if(iRef.current) clearInterval(iRef.current) }
  },[running])
  const reset = ()=>{ setRunning(false); if(iRef.current) clearInterval(iRef.current); setLeft(total) }
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 24px'}}>
      <div style={{display:'flex',gap:8,marginBottom:48}}>
        {(['work','break'] as const).map(m=>(
          <button key={m} onClick={()=>switchMode(m)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'8px 22px',borderRadius:24,border:'none',background:mode===m?color:'#1c1c28',color:mode===m?'#fff':'#555',cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.2s'}}>
            {m==='work'?<Briefcase size={13}/>:<Coffee size={13}/>}
            {m==='work'?'Focus':'Break'}
          </button>
        ))}
      </div>
      <div style={{position:'relative',width:240,height:240,marginBottom:40}}>
        <svg width={240} height={240} style={{transform:'rotate(-90deg)'}}>
          <circle cx={120} cy={120} r={R} fill="none" stroke="#1c1c28" strokeWidth={10}/>
          <motion.circle cx={120} cy={120} r={R} fill="none" stroke={color} strokeWidth={10}
            strokeLinecap="round" strokeDasharray={CIRC}
            animate={{strokeDashoffset:dashOffset}} transition={{duration:0.9,ease:'linear'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:52,fontWeight:700,fontFamily:'monospace',color:'#fff',letterSpacing:2}}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </span>
          <span style={{fontSize:11,color:'#444',marginTop:4,letterSpacing:2}}>{mode==='work'?'FOCUS':'BREAK'}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <button onClick={reset} style={{width:44,height:44,borderRadius:'50%',border:'1px solid #2a2a3e',background:'transparent',color:'#555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <RotateCcw size={16}/>
        </button>
        <button onClick={()=>setRunning(r=>!r)}
          style={{width:68,height:68,borderRadius:'50%',border:'none',background:color,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 24px '+color+'66',transition:'all 0.2s'}}>
          {running?<Pause size={24}/>:<Play size={24} style={{marginLeft:3}}/>}
        </button>
        <div style={{width:44,height:44}}/>
      </div>
      <div style={{marginTop:32,padding:'12px 24px',background:'#131320',borderRadius:12,border:'1px solid #1e1e30',fontSize:13,color:'#555'}}>
        Session {useStore(s=>s.sessions)+1} &nbsp;&bull;&nbsp; {Math.round(useStore(s=>s.sessions)*25/60*10)/10}h focused today
      </div>
    </div>
  )
}`,
  'src/components/TasksView.tsx': `
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useStore, Priority } from '../store/store'
const PC: Record<Priority,string> = {high:'#ef4444',medium:'#f97316',low:'#22c55e'}
export default function TasksView() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore()
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const add = ()=>{ if(input.trim()){ addTask(input,priority); setInput('') } }
  const done = tasks.filter(t=>t.done).length
  return (
    <div style={{maxWidth:600,margin:'0 auto',padding:32}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:600,margin:0}}>Tasks</h2>
        <span style={{fontSize:12,color:'#555'}}>{done}/{tasks.length} completed</span>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add a new task..." style={{flex:1,background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',fontSize:14,outline:'none'}}/>
        <select value={priority} onChange={e=>setPriority(e.target.value as Priority)} style={{background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,padding:'10px 10px',color:'#e2e8f0',fontSize:13,cursor:'pointer',outline:'none'}}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={add} style={{background:'#6366f1',border:'none',borderRadius:8,padding:'10px 16px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:14,fontWeight:500}}>
          <Plus size={16}/>Add
        </button>
      </div>
      <div style={{marginBottom:8,height:4,background:'#1c1c28',borderRadius:2,overflow:'hidden'}}>
        <motion.div animate={{width:(done/Math.max(tasks.length,1)*100)+'%'}} style={{height:'100%',background:'#6366f1',borderRadius:2}} transition={{duration:0.4}}/>
      </div>
      <AnimatePresence>
        {tasks.map(task=>(
          <motion.div key={task.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}} layout
            style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'#131320',borderRadius:10,border:'1px solid '+(task.done?'#1e1e30':'#232330'),marginBottom:8}}>
            <button onClick={()=>toggleTask(task.id)} style={{background:'none',border:'none',cursor:'pointer',color:task.done?'#22c55e':'#444',padding:0,display:'flex',flexShrink:0}}>
              {task.done?<CheckCircle2 size={20}/>:<Circle size={20}/>}
            </button>
            <span style={{flex:1,fontSize:14,textDecoration:task.done?'line-through':'none',color:task.done?'#444':'#e2e8f0'}}>{task.title}</span>
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:PC[task.priority]+'22',color:PC[task.priority],fontWeight:600}}>{task.priority}</span>
            <button onClick={()=>deleteTask(task.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#2a2a3e',padding:0,display:'flex'}}>
              <Trash2 size={14}/>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {tasks.length===0&&<p style={{textAlign:'center',color:'#333',fontSize:14,marginTop:32}}>No tasks yet. Add one above!</p>}
    </div>
  )
}`,
  'src/components/StatsView.tsx': `
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '../store/store'
import { motion } from 'framer-motion'
import { Zap, Target, Clock } from 'lucide-react'
export default function StatsView() {
  const { sessions, history, tasks } = useStore()
  const done = tasks.filter(t=>t.done).length
  const focusH = Math.round(sessions*25/60*10)/10
  const stats = [
    {label:'Sessions Today',value:String(sessions),color:'#6366f1',Icon:Zap},
    {label:'Tasks Completed',value:done+'/'+tasks.length,color:'#22c55e',Icon:Target},
    {label:'Focus Hours',value:focusH+'h',color:'#f97316',Icon:Clock},
  ]
  const TS = {contentStyle:{background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,fontSize:12},labelStyle:{color:'#888'}}
  return (
    <div style={{padding:32}}>
      <h2 style={{fontSize:18,fontWeight:600,marginBottom:24}}>Your Progress</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
        {stats.map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.07}}
            style={{background:'#131320',borderRadius:12,padding:20,border:'1px solid #1e1e30'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <s.Icon size={16} color={s.color}/>
              <span style={{color:'#555',fontSize:11,letterSpacing:0.5}}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{fontSize:30,fontWeight:700,color:s.color,fontFamily:'monospace'}}>{s.value}</div>
          </motion.div>
        ))}
      </div>
      <div style={{background:'#131320',borderRadius:12,padding:24,border:'1px solid #1e1e30'}}>
        <h3 style={{fontSize:12,color:'#555',marginBottom:20,letterSpacing:1}}>FOCUS SESSIONS — THIS WEEK</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={history} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false}/>
            <XAxis dataKey="day" stroke="#333" tick={{fill:'#555',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis stroke="#333" tick={{fill:'#555',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip {...TS}/>
            <Bar dataKey="sessions" radius={[4,4,0,0]}>
              {history.map((_,i)=><Cell key={i} fill={i===history.length-1?'#6366f1':'#2a2a3e'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{marginTop:16,background:'#131320',borderRadius:12,padding:20,border:'1px solid #1e1e30'}}>
        <h3 style={{fontSize:12,color:'#555',marginBottom:12,letterSpacing:1}}>TASK BREAKDOWN BY PRIORITY</h3>
        <div style={{display:'flex',gap:12}}>
          {(['high','medium','low'] as const).map(p=>{
            const cols: Record<string,string> = {high:'#ef4444',medium:'#f97316',low:'#22c55e'}
            const cnt = tasks.filter(t=>t.priority===p).length
            const dnCnt = tasks.filter(t=>t.priority===p&&t.done).length
            return (
              <div key={p} style={{flex:1,background:'#0e0e1a',borderRadius:8,padding:14,border:'1px solid #1e1e30'}}>
                <div style={{fontSize:11,color:cols[p],fontWeight:600,marginBottom:8,textTransform:'uppercase'}}>{p}</div>
                <div style={{fontSize:22,fontWeight:700,color:'#e2e8f0'}}>{dnCnt}<span style={{fontSize:13,color:'#444'}}>/{cnt}</span></div>
                <div style={{marginTop:8,height:3,background:'#1e1e30',borderRadius:2}}>
                  <div style={{height:'100%',width:(cnt>0?dnCnt/cnt*100:0)+'%',background:cols[p],borderRadius:2}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}`,
  'src/components/SettingsView.tsx': `
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, RotateCcw } from 'lucide-react'
import { useStore } from '../store/store'
export default function SettingsView() {
  const { workMins, breakMins, updateSettings } = useStore()
  const [work, setWork] = useState(String(workMins))
  const [brk, setBrk] = useState(String(breakMins))
  const [saved, setSaved] = useState(false)
  const save = ()=>{ updateSettings({workMins:parseInt(work)||25,breakMins:parseInt(brk)||5}); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const reset = ()=>{ setWork('25'); setBrk('5') }
  return (
    <div style={{maxWidth:400,margin:'0 auto',padding:32}}>
      <h2 style={{fontSize:18,fontWeight:600,marginBottom:24}}>Timer Settings</h2>
      {[{label:'Focus Duration (minutes)',value:work,set:setWork,hint:'Recommended: 25 min'},{label:'Break Duration (minutes)',value:brk,set:setBrk,hint:'Recommended: 5 min'}].map(s=>(
        <div key={s.label} style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:13,color:'#888',marginBottom:8}}>{s.label}</label>
          <input type="number" min="1" max="120" value={s.value} onChange={e=>s.set(e.target.value)} style={{width:'100%',background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,padding:'12px 14px',color:'#e2e8f0',fontSize:16,outline:'none',fontFamily:'monospace',fontWeight:700,boxSizing:'border-box'}}/>
          <p style={{margin:'6px 0 0',fontSize:11,color:'#333'}}>{s.hint}</p>
        </div>
      ))}
      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button onClick={save} style={{flex:1,background:saved?'#22c55e':'#6366f1',border:'none',borderRadius:8,padding:'12px 24px',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'background 0.3s'}}>
          <Save size={15}/>{saved?'Saved!':'Save Settings'}
        </button>
        <button onClick={reset} style={{background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,padding:'12px 14px',color:'#666',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <RotateCcw size={15}/>
        </button>
      </div>
      <div style={{marginTop:32,padding:16,background:'#131320',borderRadius:10,border:'1px solid #1e1e30',fontSize:13,color:'#555',lineHeight:1.6}}>
        <strong style={{color:'#888'}}>Pomodoro Technique</strong><br/>
        Work in focused 25-minute sprints separated by short breaks. After 4 sessions, take a longer 15-30 min break.
      </div>
    </div>
  )
}`,
}

const INSTA_FULL: Record<string, string> = {
  'src/App.tsx': `
import { AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import Explore from './components/Explore'
import Profile from './components/Profile'
import Notifications from './components/Notifications'
import StoryViewer from './components/StoryViewer'
import CommentSheet from './components/CommentSheet'
import CreateModal from './components/CreateModal'
import { useStore } from './store/store'
export default function App() {
  const { activeTab, showStory, commentPostId, showCreate } = useStore()
  const views: Record<string,any> = { home:<Feed/>, explore:<Explore/>, notifications:<Notifications/>, profile:<Profile/> }
  return (
    <div style={{maxWidth:430,margin:'0 auto',height:'100vh',background:'#fff',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden',position:'relative'}}>
      {!showStory&&(
        <header style={{borderBottom:'1px solid #dbdbdb',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:22,fontWeight:700,fontStyle:'italic',letterSpacing:-1}}>instagram</span>
          <div style={{display:'flex',gap:20}}><Heart size={24} color="#262626"/><MessageCircle size={24} color="#262626"/></div>
        </header>
      )}
      <div style={{flex:1,overflowY:'auto',overflowX:'hidden'}}>
        {views[activeTab]||<Feed/>}
      </div>
      {!showStory&&<BottomNav/>}
      <AnimatePresence>{showStory&&<StoryViewer key="sv"/>}</AnimatePresence>
      {!!commentPostId&&<CommentSheet/>}
      {showCreate&&<CreateModal/>}
    </div>
  )
}`,
  'src/store/store.tsx': `
import { create } from 'zustand'
export type Comment = {id:string;user:string;av:string;color:string;text:string;likes:number;time:string}
export type Post = {id:string;user:string;av:string;color:string;grad:string;caption:string;likes:number;liked:boolean;saved:boolean;comments:Comment[];time:string;location?:string}
export type Story = {id:string;user:string;color:string;grad:string;seen:boolean;time:string}
interface S {
  posts:Post[];stories:Story[];activeTab:string
  activeStoryIdx:number;showStory:boolean;commentPostId:string|null;showCreate:boolean;followedUsers:string[]
  setTab:(t:string)=>void;toggleLike:(id:string)=>void;toggleSave:(id:string)=>void
  openStory:(idx:number)=>void;closeStory:()=>void;nextStory:()=>void;prevStory:()=>void
  openComments:(id:string)=>void;closeComments:()=>void;addComment:(postId:string,text:string)=>void
  toggleFollow:(user:string)=>void;openCreate:()=>void;closeCreate:()=>void;addPost:(grad:string,caption:string)=>void
}
const C1:Comment[]=[
  {id:'c1',user:'sofia.t',av:'ST',color:'#f97316',text:'This is exactly what I needed today 🙌',likes:24,time:'1h'},
  {id:'c2',user:'raj.patel',av:'RP',color:'#3b82f6',text:'The future is here. Incredible work!',likes:12,time:'45m'},
  {id:'c3',user:'yuki.photo',av:'YT',color:'#a855f7',text:'Can we collab? 👀',likes:8,time:'30m'},
]
const C2:Comment[]=[
  {id:'c1',user:'alex_chen',av:'AC',color:'#6366f1',text:'Stunning work 😍',likes:31,time:'2h'},
  {id:'c2',user:'marcus_wb',av:'MW',color:'#22c55e',text:'Colors are on another level ✨',likes:19,time:'1h'},
]
const C3:Comment[]=[
  {id:'c1',user:'priya.designs',av:'PD',color:'#ec4899',text:'This view!!! Which trail? 🏔️',likes:45,time:'4h'},
  {id:'c2',user:'raj.patel',av:'RP',color:'#3b82f6',text:'Nature > everything',likes:22,time:'3h'},
]
export const useStore = create<S>((set,get)=>({
  posts:[
    {id:'1',user:'alex_chen',av:'AC',color:'#6366f1',grad:'linear-gradient(135deg,#6366f1,#8b5cf6)',caption:'Building something incredible with AI 🤖✨ The future of software is here.',likes:2847,liked:false,saved:false,comments:C1,time:'2h',location:'San Francisco'},
    {id:'2',user:'priya.designs',av:'PD',color:'#ec4899',grad:'linear-gradient(135deg,#ec4899,#f97316)',caption:'New brand identity dropping soon 🎨 Obsessed with these gradients.',likes:1293,liked:true,saved:true,comments:C2,time:'4h'},
    {id:'3',user:'marcus_wb',av:'MW',color:'#22c55e',grad:'linear-gradient(135deg,#22c55e,#06b6d4)',caption:'Sunset hike was worth every step 🌅 Nature is the best reset.',likes:5612,liked:false,saved:false,comments:C3,time:'8h',location:'Malibu, CA'},
    {id:'4',user:'sofia.t',av:'ST',color:'#f97316',grad:'linear-gradient(135deg,#fbbf24,#f97316)',caption:'coffee + code = perfect morning ☕💻 On my 4th cup, no regrets.',likes:891,liked:false,saved:false,comments:[],time:'12h'},
    {id:'5',user:'raj.patel',av:'RP',color:'#3b82f6',grad:'linear-gradient(135deg,#06b6d4,#3b82f6)',caption:'Just shipped v2.0 🚀 Six months of work finally live. Thank you all!',likes:4201,liked:false,saved:false,comments:[],time:'1d',location:'Bengaluru, India'},
    {id:'6',user:'yuki.photo',av:'YT',color:'#a855f7',grad:'linear-gradient(135deg,#a855f7,#ec4899)',caption:'Tokyo streets at midnight 🌙🏙️ No city like it.',likes:7834,liked:false,saved:false,comments:[],time:'2d',location:'Tokyo'},
  ],
  stories:[
    {id:'s1',user:'Your story',color:'#888',grad:'linear-gradient(135deg,#555,#333)',seen:false,time:''},
    {id:'s2',user:'raj.patel',color:'#3b82f6',grad:'linear-gradient(135deg,#3b82f6,#06b6d4)',seen:false,time:'2h ago'},
    {id:'s3',user:'sofia.t',color:'#f97316',grad:'linear-gradient(135deg,#f97316,#fbbf24)',seen:false,time:'4h ago'},
    {id:'s4',user:'yuki',color:'#a855f7',grad:'linear-gradient(135deg,#a855f7,#ec4899)',seen:true,time:'8h ago'},
    {id:'s5',user:'priya',color:'#ec4899',grad:'linear-gradient(135deg,#ec4899,#f97316)',seen:true,time:'12h ago'},
    {id:'s6',user:'marcus',color:'#22c55e',grad:'linear-gradient(135deg,#22c55e,#06b6d4)',seen:true,time:'1d ago'},
    {id:'s7',user:'alex',color:'#fbbf24',grad:'linear-gradient(135deg,#fbbf24,#f97316)',seen:false,time:'2d ago'},
  ],
  activeTab:'home',activeStoryIdx:0,showStory:false,commentPostId:null,showCreate:false,followedUsers:[],
  setTab:(t)=>set({activeTab:t}),
  toggleLike:(id)=>set(s=>({posts:s.posts.map(p=>p.id===id?{...p,liked:!p.liked,likes:p.liked?p.likes-1:p.likes+1}:p)})),
  toggleSave:(id)=>set(s=>({posts:s.posts.map(p=>p.id===id?{...p,saved:!p.saved}:p)})),
  openStory:(idx)=>set({showStory:true,activeStoryIdx:idx}),
  closeStory:()=>set({showStory:false,activeStoryIdx:0}),
  nextStory:()=>{ const {activeStoryIdx,stories,closeStory,showStory}=get(); if(!showStory) return; if(activeStoryIdx<stories.length-1) set({activeStoryIdx:activeStoryIdx+1}); else closeStory(); },
  prevStory:()=>{ const {activeStoryIdx}=get(); if(activeStoryIdx>0) set({activeStoryIdx:activeStoryIdx-1}); },
  openComments:(id)=>set({commentPostId:id}),
  closeComments:()=>set({commentPostId:null}),
  addComment:(postId,text)=>set(s=>({posts:s.posts.map(p=>p.id===postId?{...p,comments:[...p.comments,{id:String(Date.now()),user:'sumeet',av:'S',color:'#6366f1',text,likes:0,time:'now'}]}:p)})),
  toggleFollow:(user)=>set(s=>({followedUsers:s.followedUsers.includes(user)?s.followedUsers.filter(u=>u!==user):[...s.followedUsers,user]})),
  openCreate:()=>set({showCreate:true}),
  closeCreate:()=>set({showCreate:false}),
  addPost:(grad,caption)=>set(s=>({posts:[{id:String(Date.now()),user:'sumeet',av:'S',color:'#6366f1',grad,caption,likes:0,liked:false,saved:false,comments:[],time:'just now'},...s.posts]})),
}))`,
  'src/components/BottomNav.tsx': `
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react'
import { useStore } from '../store/store'
const TABS=[{id:'home',Icon:Home},{id:'explore',Icon:Search},{id:'create',Icon:PlusCircle},{id:'notifications',Icon:Heart},{id:'profile',Icon:User}]
export default function BottomNav() {
  const { activeTab, setTab, openCreate } = useStore()
  return (
    <nav style={{borderTop:'1px solid #dbdbdb',display:'flex',background:'#fff',flexShrink:0}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>t.id==='create'?openCreate():setTab(t.id)}
          style={{flex:1,padding:'12px 0',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <t.Icon size={26} color="#262626" fill={activeTab===t.id&&t.id!=='create'?'#262626':'none'} strokeWidth={activeTab===t.id?2.5:1.5}/>
        </button>
      ))}
    </nav>
  )
}`,
  'src/components/Feed.tsx': `
import Stories from './Stories'
import Post from './Post'
import { useStore } from '../store/store'
export default function Feed() {
  const { posts } = useStore()
  return <div><Stories/>{posts.map(p=><Post key={p.id} post={p}/>)}</div>
}`,
  'src/components/Stories.tsx': `
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store/store'
export default function Stories() {
  const { stories, openStory } = useStore()
  return (
    <div style={{display:'flex',overflowX:'auto',padding:'10px 4px',borderBottom:'1px solid #dbdbdb',scrollbarWidth:'none'}}>
      {stories.map((s,i)=>(
        <motion.div key={s.id} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:i*0.04}}
          onClick={()=>i>0&&openStory(i)}
          style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'0 8px',flexShrink:0,cursor:i>0?'pointer':'default'}}>
          <div style={{width:66,height:66,borderRadius:'50%',padding:2,background:s.seen?'#dbdbdb':('linear-gradient(45deg,#f97316,#ec4899,'+s.color+')'),display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:s.color,border:'2.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>
              {i===0?<Plus size={22} color="#fff"/>:s.user.slice(0,2).toUpperCase()}
            </div>
          </div>
          <span style={{fontSize:11,color:'#262626',maxWidth:66,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.user}</span>
        </motion.div>
      ))}
    </div>
  )
}`,
  'src/components/StoryViewer.tsx': `
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '../store/store'
const DUR = 4000
export default function StoryViewer() {
  const { stories, activeStoryIdx, showStory, closeStory, nextStory, prevStory } = useStore()
  const [prog, setProg] = useState(0)
  const story = stories[activeStoryIdx]
  useEffect(()=>{
    if(!showStory) return
    setProg(0)
    const start = Date.now()
    const iv = setInterval(()=>{
      const p = (Date.now()-start)/DUR
      if(p>=1){ clearInterval(iv); nextStory() } else setProg(p)
    },50)
    return ()=>clearInterval(iv)
  },[activeStoryIdx,showStory])
  if(!story) return null
  const handleTap = (e:React.MouseEvent)=>{
    const r=(e.currentTarget as HTMLElement).getBoundingClientRect()
    if(e.clientX<r.left+r.width/2) prevStory(); else nextStory()
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'absolute',inset:0,zIndex:100,background:story.grad,display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',gap:3,padding:'12px 10px 6px',flexShrink:0}}>
        {stories.filter((_,i)=>i>0).map((_,i)=>{
          const ri=i+1
          return (
            <div key={i} style={{flex:1,height:2.5,background:'rgba(255,255,255,0.35)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',background:'#fff',width:ri<activeStoryIdx?'100%':ri===activeStoryIdx?String(Math.round(prog*100))+'%':'0%',transition:'none'}}/>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',alignItems:'center',padding:'4px 12px 8px',gap:10,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'1.5px solid rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>{story.user.slice(0,2).toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontWeight:600,fontSize:13}}>{story.user}</div>
          {story.time&&<div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{story.time}</div>}
        </div>
        <button onClick={(e)=>{e.stopPropagation();closeStory()}} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex'}}><X size={22} color="#fff"/></button>
      </div>
      <div style={{flex:1,cursor:'pointer'}} onClick={handleTap}/>
      <div style={{padding:'10px 16px 20px',flexShrink:0}}>
        <div style={{display:'flex',gap:8}}>
          <input placeholder="Send message..." readOnly style={{flex:1,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:20,padding:'10px 16px',color:'#fff',fontSize:13,outline:'none'}}/>
          <button style={{background:'none',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'50%',width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18}}>❤️</button>
        </div>
      </div>
    </motion.div>
  )
}`,
  'src/components/Post.tsx': `
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { useStore, Post as PostType } from '../store/store'
export default function Post({post}:{post:PostType}) {
  const { toggleLike, toggleSave, openComments } = useStore()
  const [heartPos, setHeartPos] = useState({x:50,y:50})
  const [showHeart, setShowHeart] = useState(false)
  const lastTap = useRef(0)
  const doubleTap = (e:React.MouseEvent)=>{
    const now = Date.now()
    if(now-lastTap.current<300){
      const r=(e.currentTarget as HTMLElement).getBoundingClientRect()
      setHeartPos({x:e.clientX-r.left,y:e.clientY-r.top})
      if(!post.liked) toggleLike(post.id)
      setShowHeart(true); setTimeout(()=>setShowHeart(false),900)
    }
    lastTap.current=now
  }
  return (
    <div style={{borderBottom:'1px solid #efefef',paddingBottom:4}}>
      <div style={{display:'flex',alignItems:'center',padding:'10px 12px',gap:10}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(45deg,#f97316,#ec4899)',padding:1.5,flexShrink:0}}>
          <div style={{width:'100%',height:'100%',borderRadius:'50%',background:post.color,border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>{post.av}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:13,color:'#262626'}}>{post.user}</div>
          {post.location&&<div style={{fontSize:11,color:'#8e8e8e'}}>{post.location}</div>}
        </div>
        <MoreHorizontal size={20} color="#262626" style={{cursor:'pointer'}}/>
      </div>
      <div style={{width:'100%',aspectRatio:'1',position:'relative',cursor:'pointer',userSelect:'none'}} onClick={doubleTap}>
        <div style={{width:'100%',height:'100%',background:post.grad}}/>
        <AnimatePresence>
          {showHeart&&<motion.div initial={{scale:0,opacity:0.9}} animate={{scale:1.1,opacity:1}} exit={{scale:1.6,opacity:0}} transition={{duration:0.4}}
            style={{position:'absolute',left:heartPos.x-40,top:heartPos.y-40,width:80,height:80,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
            <Heart size={80} fill="white" color="white"/>
          </motion.div>}
        </AnimatePresence>
      </div>
      <div style={{padding:'10px 12px 6px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
          <motion.button whileTap={{scale:1.3}} onClick={()=>toggleLike(post.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,marginRight:16,display:'flex',lineHeight:0}}>
            <Heart size={26} fill={post.liked?'#ef4444':'none'} color={post.liked?'#ef4444':'#262626'}/>
          </motion.button>
          <button onClick={()=>openComments(post.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,marginRight:16,display:'flex',lineHeight:0}}>
            <MessageCircle size={26} color="#262626"/>
          </button>
          <Send size={23} color="#262626" style={{cursor:'pointer',flex:1,transform:'rotate(18deg)'}}/>
          <motion.button whileTap={{scale:1.3}} onClick={()=>toggleSave(post.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',lineHeight:0}}>
            <Bookmark size={26} fill={post.saved?'#262626':'none'} color="#262626"/>
          </motion.button>
        </div>
        <div style={{fontWeight:600,fontSize:13,color:'#262626',marginBottom:4}}>{post.likes.toLocaleString()} likes</div>
        <div style={{fontSize:13,color:'#262626',lineHeight:1.4,marginBottom:3}}>
          <span style={{fontWeight:600}}>{post.user}</span>{' '}{post.caption}
        </div>
        {post.comments.length>0&&<div onClick={()=>openComments(post.id)} style={{fontSize:12,color:'#8e8e8e',cursor:'pointer',marginBottom:2}}>View all {post.comments.length} comments</div>}
        <div style={{fontSize:11,color:'#c7c7c7',textTransform:'uppercase',letterSpacing:0.5,marginTop:2}}>{post.time}</div>
      </div>
    </div>
  )
}`,
  'src/components/CommentSheet.tsx': `
import { useState } from 'react'
import { Heart, X } from 'lucide-react'
import { useStore } from '../store/store'
export default function CommentSheet() {
  const { posts, commentPostId, closeComments, addComment } = useStore()
  const [text, setText] = useState('')
  const post = posts.find(p=>p.id===commentPostId)
  if(!post) return null
  const submit = ()=>{ if(text.trim()){ addComment(post.id,text); setText('') } }
  return (
    <>
      <div onClick={closeComments} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50}}/>
      <div style={{position:'fixed',bottom:0,left:'calc(50% - 215px)',width:430,background:'#fff',borderRadius:'16px 16px 0 0',zIndex:51,maxHeight:'72vh',display:'flex',flexDirection:'column',boxShadow:'0 -4px 24px rgba(0,0,0,0.12)'}}>
        <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px'}}>
          <div style={{width:36,height:4,background:'#dbdbdb',borderRadius:2}}/>
        </div>
        <div style={{padding:'4px 16px 10px',borderBottom:'1px solid #efefef',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          <span style={{fontWeight:600,fontSize:14}}>Comments</span>
          <button onClick={closeComments} style={{position:'absolute',right:12,background:'none',border:'none',cursor:'pointer',display:'flex',padding:4}}><X size={18} color="#262626"/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
          {post.comments.length===0&&<div style={{padding:'32px',textAlign:'center',color:'#8e8e8e',fontSize:14}}>No comments yet. Be the first!</div>}
          {post.comments.map(c=>(
            <div key={c.id} style={{display:'flex',gap:10,padding:'8px 16px',alignItems:'flex-start'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{c.av}</div>
              <div style={{flex:1}}>
                <span style={{fontWeight:600,fontSize:13}}>{c.user}</span>
                <span style={{fontSize:13,color:'#262626'}}>{' '+c.text}</span>
                <div style={{display:'flex',gap:12,marginTop:4,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'#8e8e8e'}}>{c.time}</span>
                  <span style={{fontSize:11,color:'#8e8e8e',fontWeight:600,cursor:'pointer'}}>Reply</span>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,paddingTop:2}}>
                <Heart size={13} color="#8e8e8e"/><span style={{fontSize:10,color:'#8e8e8e'}}>{c.likes}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid #efefef',padding:'10px 14px',display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>S</div>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Add a comment..." style={{flex:1,border:'none',outline:'none',fontSize:13,color:'#262626',background:'transparent'}}/>
          {text.trim()&&<button onClick={submit} style={{background:'none',border:'none',cursor:'pointer',color:'#0095f6',fontWeight:700,fontSize:13}}>Post</button>}
        </div>
      </div>
    </>
  )
}`,
  'src/components/Explore.tsx': `
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
const ALL=[
  {g:'linear-gradient(135deg,#6366f1,#ec4899)',t:true},{g:'linear-gradient(135deg,#22c55e,#06b6d4)',t:false},{g:'linear-gradient(135deg,#f97316,#fbbf24)',t:false},
  {g:'linear-gradient(135deg,#8b5cf6,#3b82f6)',t:false},{g:'linear-gradient(135deg,#ef4444,#f97316)',t:true},{g:'linear-gradient(135deg,#06b6d4,#22c55e)',t:false},
  {g:'linear-gradient(135deg,#ec4899,#a855f7)',t:false},{g:'linear-gradient(135deg,#fbbf24,#ef4444)',t:false},{g:'linear-gradient(135deg,#3b82f6,#6366f1)',t:true},
  {g:'linear-gradient(135deg,#10b981,#3b82f6)',t:false},{g:'linear-gradient(135deg,#f59e0b,#ec4899)',t:false},{g:'linear-gradient(135deg,#0ea5e9,#6366f1)',t:false},
  {g:'linear-gradient(135deg,#a855f7,#ef4444)',t:false},{g:'linear-gradient(135deg,#84cc16,#06b6d4)',t:false},{g:'linear-gradient(135deg,#e11d48,#7c3aed)',t:false},
]
export default function Explore() {
  const [q, setQ] = useState('')
  const items = q ? ALL.slice(0, 6) : ALL
  return (
    <div>
      <div style={{padding:'8px 12px 6px'}}>
        <div style={{background:'#efefef',borderRadius:10,padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
          <Search size={14} color="#8e8e8e"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:14,color:'#262626'}}/>
          {q&&<button onClick={()=>setQ('')} style={{background:'none',border:'none',cursor:'pointer',display:'flex',padding:0}}><X size={14} color="#8e8e8e"/></button>}
        </div>
      </div>
      {q&&<div style={{padding:'8px 12px',fontSize:13,color:'#8e8e8e'}}>Showing results for "{q}"</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
        {items.map((item,i)=>(
          <motion.div key={q+i} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.025}}
            style={{background:item.g,aspectRatio:item.t?'1/2':'1',cursor:'pointer',gridRow:item.t?'span 2':'span 1'}}/>
        ))}
      </div>
    </div>
  )
}`,
  'src/components/Profile.tsx': `
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Grid3x3, Bookmark, Tag } from 'lucide-react'
import { useStore } from '../store/store'
const BASE_GRADS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#22c55e,#06b6d4)','linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#fbbf24,#f97316)','linear-gradient(135deg,#3b82f6,#6366f1)','linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#22c55e)','linear-gradient(135deg,#ef4444,#ec4899)','linear-gradient(135deg,#10b981,#3b82f6)',
]
export default function Profile() {
  const { posts } = useStore()
  const [activeTab, setActiveTab] = useState(0)
  const myGrads = [...posts.filter(p=>p.user==='sumeet').map(p=>p.grad), ...BASE_GRADS].slice(0,9)
  const savedGrads = posts.filter(p=>p.saved).map(p=>p.grad)
  const grids = [myGrads, savedGrads, BASE_GRADS.slice(0,6)]
  const grid = grids[activeTab]
  const TABS = [{Icon:Grid3x3},{Icon:Bookmark},{Icon:Tag}]
  return (
    <div>
      <div style={{padding:'16px 16px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:22,marginBottom:14}}>
          <div style={{width:86,height:86,borderRadius:'50%',background:'linear-gradient(45deg,#f97316,#ec4899,#6366f1)',padding:2.5,flexShrink:0}}>
            <div style={{width:'100%',height:'100%',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'2.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:700,color:'#fff'}}>S</div>
          </div>
          <div style={{display:'flex',gap:16,flex:1,justifyContent:'space-around'}}>
            {[{n:String(9+posts.filter(p=>p.user==='sumeet').length),l:'posts'},{n:'1.4K',l:'followers'},{n:'512',l:'following'}].map(s=>(
              <div key={s.l} style={{textAlign:'center',cursor:'pointer'}}>
                <div style={{fontSize:17,fontWeight:700,color:'#262626'}}>{s.n}</div>
                <div style={{fontSize:12,color:'#262626'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:'#262626',marginBottom:2}}>sumeet.wyberai</div>
        <div style={{fontSize:13,color:'#262626',lineHeight:1.6,marginBottom:12}}>
          Building AI tools that build things 🤖⚡<br/>
          Founder <span style={{color:'#00376b'}}>@wyberai</span><br/>
          <span style={{color:'#00376b'}}>wyberai.com</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:6,marginBottom:12}}>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#262626'}}>Edit profile</button>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#262626'}}>Share profile</button>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16}}>👤</button>
        </div>
      </div>
      <div style={{display:'flex',borderTop:'1px solid #dbdbdb'}}>
        {TABS.map(({Icon},i)=>(
          <div key={i} onClick={()=>setActiveTab(i)} style={{flex:1,display:'flex',justifyContent:'center',padding:'11px 0',borderBottom:activeTab===i?'1px solid #262626':'1px solid transparent',cursor:'pointer',transition:'border-color 0.15s'}}>
            <Icon size={22} color={activeTab===i?'#262626':'#8e8e8e'}/>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
        {grid.map((g,i)=>(
          <motion.div key={String(activeTab)+i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.035}}
            style={{background:g,aspectRatio:'1',cursor:'pointer'}}/>
        ))}
        {grid.length===0&&<div style={{gridColumn:'1/-1',padding:'48px 0',textAlign:'center',color:'#8e8e8e',fontSize:14}}>{activeTab===1?'No saved posts yet — tap the bookmark icon on any post':'No tagged posts'}</div>}
      </div>
    </div>
  )
}`,
  'src/components/Notifications.tsx': `
import { motion } from 'framer-motion'
import { useStore } from '../store/store'
const ITEMS = [
  {u:'raj.patel',av:'RP',c:'#3b82f6',a:'liked your photo.',t:'2m',post:'linear-gradient(135deg,#3b82f6,#6366f1)',type:'like'},
  {u:'priya.designs',av:'PD',c:'#ec4899',a:'started following you.',t:'15m',post:null,type:'follow'},
  {u:'marcus_wb',av:'MW',c:'#22c55e',a:'commented: "Incredible work 🔥"',t:'1h',post:'linear-gradient(135deg,#22c55e,#06b6d4)',type:'comment'},
  {u:'sofia.t',av:'ST',c:'#f97316',a:'liked your photo.',t:'2h',post:'linear-gradient(135deg,#fbbf24,#f97316)',type:'like'},
  {u:'yuki.photo',av:'YT',c:'#a855f7',a:'started following you.',t:'4h',post:null,type:'follow'},
  {u:'alex_chen',av:'AC',c:'#6366f1',a:'mentioned you in a comment.',t:'6h',post:'linear-gradient(135deg,#6366f1,#8b5cf6)',type:'mention'},
  {u:'priya.designs',av:'PD',c:'#ec4899',a:'liked your reel.',t:'12h',post:'linear-gradient(135deg,#ec4899,#a855f7)',type:'like'},
  {u:'raj.patel',av:'RP',c:'#3b82f6',a:'commented: "Ship it! 🚀"',t:'1d',post:'linear-gradient(135deg,#06b6d4,#22c55e)',type:'comment'},
  {u:'marcus_wb',av:'MW',c:'#22c55e',a:'and 47 others liked your post.',t:'2d',post:'linear-gradient(135deg,#f97316,#ef4444)',type:'like'},
]
export default function Notifications() {
  const { followedUsers, toggleFollow } = useStore()
  return (
    <div>
      <div style={{padding:'12px 14px 4px',fontSize:16,fontWeight:700,color:'#262626'}}>Activity</div>
      <div style={{padding:'2px 14px 8px',fontSize:12,fontWeight:600,color:'#8e8e8e',letterSpacing:0.3}}>THIS WEEK</div>
      {ITEMS.map((item,i)=>{
        const isFollowing = followedUsers.includes(item.u)
        return (
          <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
            style={{display:'flex',alignItems:'center',padding:'8px 14px',gap:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:item.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{item.av}</div>
            <div style={{flex:1,fontSize:13,color:'#262626',lineHeight:1.4}}>
              <span style={{fontWeight:600}}>{item.u}</span>{' '+item.a+' '}
              <span style={{color:'#8e8e8e'}}>{item.t}</span>
            </div>
            {item.type==='follow'
              ? <motion.button whileTap={{scale:0.95}} onClick={()=>toggleFollow(item.u)}
                  style={{background:isFollowing?'#fff':'#0095f6',color:isFollowing?'#262626':'#fff',border:isFollowing?'1px solid #dbdbdb':'none',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',minWidth:84,transition:'all 0.2s'}}>
                  {isFollowing?'Following':'Follow'}
                </motion.button>
              : item.post&&<div style={{width:44,height:44,background:item.post,flexShrink:0,cursor:'pointer'}}/>
            }
          </motion.div>
        )
      })}
    </div>
  )
}`,
  'src/components/CreateModal.tsx': `
import { useState } from 'react'
import { X, MapPin, ChevronRight } from 'lucide-react'
import { useStore } from '../store/store'
const GRADS=[
  'linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#22c55e,#06b6d4)','linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#3b82f6,#6366f1)','linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#ef4444,#ec4899)','linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)','linear-gradient(135deg,#84cc16,#06b6d4)',
]
export default function CreateModal() {
  const { closeCreate, addPost, setTab } = useStore()
  const [sel, setSel] = useState(GRADS[0])
  const [caption, setCaption] = useState('')
  const share = ()=>{
    if(!caption.trim()) return
    addPost(sel, caption)
    closeCreate()
    setTab('home')
  }
  return (
    <>
      <div onClick={closeCreate} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50}}/>
      <div style={{position:'fixed',bottom:0,left:'calc(50% - 215px)',width:430,background:'#fff',borderRadius:'14px 14px 0 0',zIndex:51,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #efefef'}}>
          <button onClick={closeCreate} style={{background:'none',border:'none',cursor:'pointer',display:'flex',padding:4}}><X size={20} color="#262626"/></button>
          <span style={{fontWeight:600,fontSize:15}}>New post</span>
          <button onClick={share} style={{background:'none',border:'none',cursor:'pointer',color:'#0095f6',fontWeight:700,fontSize:14,opacity:caption.trim()?1:0.35,pointerEvents:caption.trim()?'auto':'none'}}>Share</button>
        </div>
        <div style={{width:'100%',height:160,background:sel,transition:'background 0.3s'}}/>
        <div style={{padding:'10px 14px 0'}}>
          <div style={{fontSize:11,color:'#8e8e8e',marginBottom:8,fontWeight:600,letterSpacing:0.5}}>CHOOSE STYLE</div>
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:10,scrollbarWidth:'none'}}>
            {GRADS.map((g,i)=>(
              <div key={i} onClick={()=>setSel(g)} style={{width:44,height:44,borderRadius:10,background:g,flexShrink:0,cursor:'pointer',boxSizing:'border-box',border:sel===g?'3px solid #0095f6':'3px solid transparent',transition:'border 0.15s'}}/>
            ))}
          </div>
        </div>
        <div style={{borderTop:'1px solid #efefef',padding:'10px 14px 4px'}}>
          <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>S</div>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write a caption..." rows={3} style={{flex:1,border:'none',outline:'none',fontSize:14,resize:'none',color:'#262626',fontFamily:'inherit',lineHeight:1.5}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderTop:'1px solid #efefef'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
              <MapPin size={16} color="#8e8e8e"/><span style={{fontSize:13,color:'#262626'}}>Add location</span>
            </div>
            <ChevronRight size={16} color="#c7c7c7"/>
          </div>
        </div>
      </div>
    </>
  )
}`,
}

const INSTA_FILES: Record<string, string> = { 'src/App.tsx': `-- PLACEHOLDER --` }
const INSTA_FILES_V2: Record<string, string> = {
  'src/App.tsx': `
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, MessageCircle } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import Explore from './components/Explore'
import Profile from './components/Profile'
import Notifications from './components/Notifications'
import { useStore } from './store/store'
export default function App() {
  const { activeTab } = useStore()
  const views: Record<string,any> = {
    home:<Feed/>, explore:<Explore/>, notifications:<Notifications/>, profile:<Profile/>
  }
  return (
    <div style={{maxWidth:430,margin:'0 auto',height:'100vh',background:'#fff',display:'flex',flexDirection:'column',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      <header style={{borderBottom:'1px solid #dbdbdb',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'#fff'}}>
        <span style={{fontSize:22,fontWeight:700,fontStyle:'italic',letterSpacing:-1,color:'#262626'}}>instagram</span>
        <div style={{display:'flex',gap:20}}>
          <Heart size={24} color="#262626"/>
          <MessageCircle size={24} color="#262626"/>
        </div>
      </header>
      <div style={{flex:1,overflowY:'auto',overflowX:'hidden'}}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.12}}>
            {views[activeTab] || <Feed/>}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav/>
    </div>
  )
}`,
  'src/store/store.tsx': `
import { create } from 'zustand'
export type Post = {id:string;user:string;av:string;color:string;grad:string;caption:string;likes:number;liked:boolean;saved:boolean;comments:number;time:string}
export type Story = {id:string;user:string;color:string;seen:boolean}
interface S {
  posts:Post[]; stories:Story[]; activeTab:string
  setTab:(t:string)=>void
  toggleLike:(id:string)=>void
  toggleSave:(id:string)=>void
}
const POSTS:Post[] = [
  {id:'1',user:'alex_chen',av:'AC',color:'#6366f1',grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',caption:'Building something incredible with AI this week. The future of software is here 🤖✨',likes:2847,liked:false,saved:false,comments:142,time:'2h'},
  {id:'2',user:'priya.designs',av:'PD',color:'#ec4899',grad:'linear-gradient(135deg,#ec4899 0%,#f97316 100%)',caption:'New brand identity project dropping soon 🎨 Obsessed with these gradients.',likes:1293,liked:true,saved:true,comments:87,time:'4h'},
  {id:'3',user:'marcus_wb',av:'MW',color:'#22c55e',grad:'linear-gradient(135deg,#22c55e 0%,#06b6d4 100%)',caption:'Sunset hike was absolutely worth every step 🏔️🌅 Nature is the best reset button.',likes:5612,liked:false,saved:false,comments:234,time:'8h'},
  {id:'4',user:'sofia.t',av:'ST',color:'#f97316',grad:'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)',caption:'coffee + code + good music = perfect morning ☕💻 Currently on cup #4, zero regrets.',likes:891,liked:false,saved:false,comments:56,time:'12h'},
  {id:'5',user:'raj.patel',av:'RP',color:'#3b82f6',grad:'linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)',caption:'Just shipped v2.0 after 6 months of work 🚀 Thanks to everyone who believed in this. We are just getting started.',likes:4201,liked:false,saved:false,comments:198,time:'1d'},
  {id:'6',user:'yuki.photo',av:'YT',color:'#a855f7',grad:'linear-gradient(135deg,#a855f7 0%,#ec4899 100%)',caption:'Tokyo streets at midnight hit different 🌙🏙️ There is no city like it on earth.',likes:7834,liked:false,saved:false,comments:441,time:'2d'},
]
const STORIES:Story[] = [
  {id:'s1',user:'Your story',color:'#6366f1',seen:false},
  {id:'s2',user:'raj.patel',color:'#3b82f6',seen:false},
  {id:'s3',user:'sofia.t',color:'#f97316',seen:false},
  {id:'s4',user:'yuki',color:'#a855f7',seen:true},
  {id:'s5',user:'priya',color:'#ec4899',seen:true},
  {id:'s6',user:'marcus',color:'#22c55e',seen:true},
  {id:'s7',user:'alex',color:'#fbbf24',seen:false},
]
export const useStore = create<S>((set)=>({
  posts:POSTS, stories:STORIES, activeTab:'home',
  setTab:(t)=>set({activeTab:t}),
  toggleLike:(id)=>set(s=>({posts:s.posts.map(p=>p.id===id?{...p,liked:!p.liked,likes:p.liked?p.likes-1:p.likes+1}:p)})),
  toggleSave:(id)=>set(s=>({posts:s.posts.map(p=>p.id===id?{...p,saved:!p.saved}:p)})),
}))`,
  'src/components/BottomNav.tsx': `
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react'
import { useStore } from '../store/store'
const TABS = [{id:'home',Icon:Home},{id:'explore',Icon:Search},{id:'create',Icon:PlusCircle},{id:'notifications',Icon:Heart},{id:'profile',Icon:User}]
export default function BottomNav() {
  const { activeTab, setTab } = useStore()
  return (
    <nav style={{borderTop:'1px solid #dbdbdb',display:'flex',background:'#fff',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'12px 0',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <t.Icon size={26} color="#262626" fill={activeTab===t.id&&t.id!=='create'?'#262626':'none'} strokeWidth={activeTab===t.id?2.5:1.5}/>
        </button>
      ))}
    </nav>
  )
}`,
  'src/components/Feed.tsx': `
import Stories from './Stories'
import Post from './Post'
import { useStore } from '../store/store'
export default function Feed() {
  const { posts } = useStore()
  return (
    <div>
      <Stories/>
      {posts.map(p=><Post key={p.id} post={p}/>)}
    </div>
  )
}`,
  'src/components/Stories.tsx': `
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store/store'
export default function Stories() {
  const { stories } = useStore()
  return (
    <div style={{display:'flex',overflowX:'auto',padding:'10px 4px',borderBottom:'1px solid #dbdbdb',scrollbarWidth:'none',gap:0}}>
      {stories.map((s,i)=>(
        <motion.div key={s.id} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:i*0.05}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'0 8px',flexShrink:0,cursor:'pointer'}}>
          <div style={{
            width:66,height:66,borderRadius:'50%',padding:2,
            background:s.seen?'#dbdbdb':('linear-gradient(45deg,#f97316,#ec4899,'+s.color+')'),
            display:'flex',alignItems:'center',justifyContent:'center'
          }}>
            <div style={{width:60,height:60,borderRadius:'50%',background:s.color,border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>
              {s.user==='Your story'?<Plus size={22} color="#fff"/>:s.user.slice(0,2).toUpperCase()}
            </div>
          </div>
          <span style={{fontSize:11,color:'#262626',maxWidth:66,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.user}</span>
        </motion.div>
      ))}
    </div>
  )
}`,
  'src/components/Post.tsx': `
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { useStore, Post as PostType } from '../store/store'
export default function Post({post}:{post:PostType}) {
  const { toggleLike, toggleSave } = useStore()
  const [showHeart, setShowHeart] = useState(false)
  const lastTap = useRef(0)
  const handleTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (!post.liked) toggleLike(post.id)
      setShowHeart(true); setTimeout(()=>setShowHeart(false), 900)
    }
    lastTap.current = now
  }
  return (
    <div style={{borderBottom:'1px solid #efefef',marginBottom:2}}>
      <div style={{display:'flex',alignItems:'center',padding:'10px 12px',gap:10}}>
        <div style={{width:36,height:36,borderRadius:'50%',padding:1.5,background:'linear-gradient(45deg,#f97316,#ec4899)',flexShrink:0}}>
          <div style={{width:33,height:33,borderRadius:'50%',background:post.color,border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>{post.av}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:13,color:'#262626'}}>{post.user}</div>
          <div style={{fontSize:11,color:'#8e8e8e'}}>Original audio</div>
        </div>
        <MoreHorizontal size={20} color="#262626" style={{cursor:'pointer'}}/>
      </div>
      <div style={{width:'100%',aspectRatio:'1',position:'relative',cursor:'pointer'}} onClick={handleTap}>
        <div style={{width:'100%',height:'100%',background:post.grad}}/>
        <AnimatePresence>
          {showHeart&&(
            <motion.div initial={{scale:0,opacity:0.9}} animate={{scale:1.1,opacity:1}} exit={{scale:1.8,opacity:0}} transition={{duration:0.4}}
              style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
              <Heart size={90} fill="white" color="white"/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{padding:'10px 12px 8px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
          <motion.button whileTap={{scale:1.25}} onClick={()=>toggleLike(post.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,marginRight:16,display:'flex',lineHeight:0}}>
            <Heart size={26} fill={post.liked?'#ef4444':'none'} color={post.liked?'#ef4444':'#262626'}/>
          </motion.button>
          <MessageCircle size={26} color="#262626" style={{cursor:'pointer',marginRight:16}}/>
          <Send size={24} color="#262626" style={{cursor:'pointer',flex:1,transform:'rotate(20deg)'}}/>
          <motion.button whileTap={{scale:1.25}} onClick={()=>toggleSave(post.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',lineHeight:0}}>
            <Bookmark size={26} fill={post.saved?'#262626':'none'} color="#262626"/>
          </motion.button>
        </div>
        <div style={{fontWeight:600,fontSize:13,color:'#262626',marginBottom:4}}>{post.likes.toLocaleString()} likes</div>
        <div style={{fontSize:13,color:'#262626',lineHeight:1.4,marginBottom:4}}>
          <span style={{fontWeight:600}}>{post.user}</span>{' '}{post.caption}
        </div>
        <div style={{fontSize:12,color:'#8e8e8e',cursor:'pointer',marginBottom:4}}>View all {post.comments} comments</div>
        <div style={{fontSize:11,color:'#c7c7c7',textTransform:'uppercase',letterSpacing:0.5}}>{post.time}</div>
      </div>
    </div>
  )
}`,
  'src/components/Explore.tsx': `
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
const G = [
  'linear-gradient(135deg,#6366f1,#ec4899)','linear-gradient(135deg,#22c55e,#06b6d4)','linear-gradient(135deg,#f97316,#fbbf24)',
  'linear-gradient(135deg,#8b5cf6,#3b82f6)','linear-gradient(135deg,#ef4444,#f97316)','linear-gradient(135deg,#06b6d4,#22c55e)',
  'linear-gradient(135deg,#ec4899,#a855f7)','linear-gradient(135deg,#fbbf24,#ef4444)','linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#10b981,#3b82f6)','linear-gradient(135deg,#f59e0b,#ec4899)','linear-gradient(135deg,#8b5cf6,#ef4444)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)','linear-gradient(135deg,#84cc16,#06b6d4)','linear-gradient(135deg,#e11d48,#7c3aed)',
]
export default function Explore() {
  return (
    <div>
      <div style={{padding:'8px 12px 4px'}}>
        <div style={{background:'#efefef',borderRadius:10,padding:'9px 14px',display:'flex',alignItems:'center',gap:8}}>
          <Search size={14} color="#8e8e8e"/><span style={{color:'#8e8e8e',fontSize:14}}>Search</span>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
        {G.map((g,i)=>(
          <motion.div key={i} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.025}}
            style={{background:g,aspectRatio:i%7===0||i%9===0?'1/2':'1',cursor:'pointer',gridRow:i%7===0||i%9===0?'span 2':'span 1'}}/>
        ))}
      </div>
    </div>
  )
}`,
  'src/components/Profile.tsx': `
import { motion } from 'framer-motion'
import { Grid3x3, Bookmark, Tag } from 'lucide-react'
const GRID = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#22c55e,#06b6d4)','linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#fbbf24,#f97316)','linear-gradient(135deg,#3b82f6,#6366f1)','linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#22c55e)','linear-gradient(135deg,#ef4444,#ec4899)','linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#8b5cf6,#3b82f6)','linear-gradient(135deg,#0ea5e9,#22c55e)',
]
export default function Profile() {
  return (
    <div>
      <div style={{padding:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:14}}>
          <div style={{width:86,height:86,borderRadius:'50%',padding:2,background:'linear-gradient(45deg,#f97316,#ec4899,#6366f1)',flexShrink:0}}>
            <div style={{width:82,height:82,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:700,color:'#fff'}}>S</div>
          </div>
          <div style={{display:'flex',gap:20,flex:1,justifyContent:'space-around'}}>
            {[{n:'12',l:'posts'},{n:'1.4K',l:'followers'},{n:'512',l:'following'}].map(s=>(
              <div key={s.l} style={{textAlign:'center'}}>
                <div style={{fontSize:17,fontWeight:700,color:'#262626'}}>{s.n}</div>
                <div style={{fontSize:12,color:'#262626'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:'#262626',marginBottom:2}}>sumeet.wyberai</div>
        <div style={{fontSize:13,color:'#262626',lineHeight:1.5,marginBottom:12}}>
          Building AI tools that build things 🤖⚡<br/>Founder <a href="#" style={{color:'#00376b',textDecoration:'none'}}>@wyberai</a><br/>
          <span style={{color:'#00376b'}}>wyberai.com</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#262626'}}>Edit profile</button>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#262626'}}>Share profile</button>
          <button style={{background:'#efefef',border:'none',borderRadius:8,padding:'7px 0',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </button>
        </div>
      </div>
      <div style={{display:'flex',borderTop:'1px solid #dbdbdb',borderBottom:'1px solid #dbdbdb'}}>
        {[{Icon:Grid3x3,active:true},{Icon:Bookmark,active:false},{Icon:Tag,active:false}].map(({Icon,active},i)=>(
          <div key={i} style={{flex:1,display:'flex',justifyContent:'center',padding:'12px 0',borderBottom:active?'1px solid #262626':'1px solid transparent',cursor:'pointer'}}>
            <Icon size={22} color={active?'#262626':'#8e8e8e'}/>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
        {GRID.map((g,i)=>(
          <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
            style={{background:g,aspectRatio:'1',cursor:'pointer'}}/>
        ))}
      </div>
    </div>
  )
}`,
  'src/components/Notifications.tsx': `
import { motion } from 'framer-motion'
const ITEMS = [
  {u:'raj.patel',av:'RP',c:'#3b82f6',a:'liked your photo.',t:'2m',post:'linear-gradient(135deg,#3b82f6,#6366f1)'},
  {u:'priya.designs',av:'PD',c:'#ec4899',a:'started following you.',t:'15m',post:null},
  {u:'marcus_wb',av:'MW',c:'#22c55e',a:'commented: "This is incredible 🔥 keep it up"',t:'1h',post:'linear-gradient(135deg,#22c55e,#06b6d4)'},
  {u:'sofia.t',av:'ST',c:'#f97316',a:'liked your photo.',t:'2h',post:'linear-gradient(135deg,#fbbf24,#f97316)'},
  {u:'yuki.photo',av:'YT',c:'#a855f7',a:'started following you.',t:'4h',post:null},
  {u:'alex_chen',av:'AC',c:'#6366f1',a:'mentioned you in a comment.',t:'6h',post:'linear-gradient(135deg,#6366f1,#8b5cf6)'},
  {u:'priya.designs',av:'PD',c:'#ec4899',a:'liked your reel.',t:'12h',post:'linear-gradient(135deg,#ec4899,#a855f7)'},
  {u:'raj.patel',av:'RP',c:'#3b82f6',a:'commented: "Ship it! 🚀 We are ready"',t:'1d',post:'linear-gradient(135deg,#06b6d4,#22c55e)'},
  {u:'marcus_wb',av:'MW',c:'#22c55e',a:'and 47 others liked your post.',t:'2d',post:'linear-gradient(135deg,#f97316,#ef4444)'},
]
export default function Notifications() {
  return (
    <div>
      <div style={{padding:'12px 14px 6px',fontSize:16,fontWeight:700,color:'#262626'}}>Activity</div>
      <div style={{padding:'6px 14px 4px',fontSize:12,fontWeight:600,color:'#8e8e8e',letterSpacing:0.3}}>THIS WEEK</div>
      {ITEMS.map((item,i)=>(
        <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
          style={{display:'flex',alignItems:'center',padding:'8px 14px',gap:12}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:item.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{item.av}</div>
          <div style={{flex:1,fontSize:13,color:'#262626',lineHeight:1.4}}>
            <span style={{fontWeight:600}}>{item.u}</span>{' '+item.a+' '}
            <span style={{color:'#8e8e8e'}}>{item.t}</span>
          </div>
          {item.post
            ? <div style={{width:44,height:44,background:item.post,flexShrink:0,cursor:'pointer'}}/>
            : <button style={{background:'#0095f6',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>Follow</button>
          }
        </motion.div>
      ))}
    </div>
  )
}`,
}

const BREAKOUT_APP = `
import { useEffect, useRef } from 'react'
const COLS = 8, ROWS = 5
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6']
export default function App() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    canvas.width = 640; canvas.height = 480
    const ctx = canvas.getContext('2d')
    const W = 640, H = 480
    let state = 'menu', score = 0, lives = 3
    let paddle = {x:270,y:440,w:100,h:12}
    let ball = {x:320,y:400,vx:3.5,vy:-4}
    const R = 8
    let bricks = [], particles = []
    const mkBricks = () => {
      bricks = []
      const BW=64,BH=20,GAP=6,sx=(W-COLS*(BW+GAP)+GAP)/2
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
        bricks.push({x:sx+c*(BW+GAP),y:55+r*(BH+GAP),w:BW,h:BH,alive:true,color:COLORS[r%5],hits:r<2?2:1})
    }
    const reset = () => { score=0;lives=3;paddle={x:270,y:440,w:100,h:12};ball={x:320,y:400,vx:3.5,vy:-4};particles=[];mkBricks();state='playing' }
    mkBricks()
    const keys = {}
    const kd = e => { keys[e.key]=true; if(e.key===' '&&state!=='playing') reset(); e.preventDefault() }
    const ku = e => { keys[e.key]=false }
    document.addEventListener('keydown',kd)
    document.addEventListener('keyup',ku)
    canvas.addEventListener('mousemove',e=>{
      const r2=canvas.getBoundingClientRect()
      paddle.x=Math.max(0,Math.min(W-paddle.w,(e.clientX-r2.left)*(W/r2.width)-paddle.w/2))
    })
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      ctx.fillStyle='#09090b'; ctx.fillRect(0,0,W,H)
      ctx.fillStyle='#111'; ctx.fillRect(0,0,W,45)
      if(state!=='playing'){
        ctx.font='bold 36px monospace'; ctx.textAlign='center'
        ctx.fillStyle='#6366f1'
        ctx.fillText(state==='menu'?'BREAKOUT':state==='over'?'GAME OVER':'YOU WIN! 🎉',W/2,H/2-20)
        ctx.font='14px sans-serif'; ctx.fillStyle='#777'
        ctx.fillText('SPACE or click paddle area  •  mouse / ←→ to move',W/2,H/2+16)
        if(state!=='menu'){ ctx.font='bold 18px monospace';ctx.fillStyle='#6366f1';ctx.fillText('Score: '+score,W/2,H/2+50) }
        return
      }
      if(keys['ArrowLeft']||keys['a']) paddle.x=Math.max(0,paddle.x-6)
      if(keys['ArrowRight']||keys['d']) paddle.x=Math.min(W-paddle.w,paddle.x+6)
      ball.x+=ball.vx; ball.y+=ball.vy
      if(ball.x-R<0){ball.x=R;ball.vx=Math.abs(ball.vx)}
      if(ball.x+R>W){ball.x=W-R;ball.vx=-Math.abs(ball.vx)}
      if(ball.y-R<45){ball.y=45+R;ball.vy=Math.abs(ball.vy)}
      if(ball.vy>0&&ball.y+R>=paddle.y&&ball.y-R<=paddle.y+paddle.h&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w){
        const o=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2)
        ball.vx=o*5.5; ball.vy=-Math.abs(ball.vy)
        const sp=Math.hypot(ball.vx,ball.vy); if(sp>7){ball.vx=ball.vx/sp*7;ball.vy=ball.vy/sp*7}
        ball.y=paddle.y-R
      }
      if(ball.y-R>H){ lives--; if(lives<=0){state='over'}else{ball={x:W/2,y:H-80,vx:3.5*(Math.random()>.5?1:-1),vy:-4}} }
      let alive=0
      for(const b of bricks){
        if(!b.alive) continue; alive++
        if(ball.x+R>b.x&&ball.x-R<b.x+b.w&&ball.y+R>b.y&&ball.y-R<b.y+b.h){
          b.hits--
          if(b.hits<=0){ b.alive=false; score+=10; alive--
            for(let i=0;i<10;i++){ const a=Math.random()*Math.PI*2,sp=1+Math.random()*3; particles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color:b.color}) }
          }
          const fl=ball.x<b.x+b.w/2, ft=ball.y<b.y+b.h/2
          const ox=fl?ball.x+R-b.x:b.x+b.w-(ball.x-R), oy=ft?ball.y+R-b.y:b.y+b.h-(ball.y-R)
          if(ox<oy) ball.vx=fl?-Math.abs(ball.vx):Math.abs(ball.vx)
          else ball.vy=ft?-Math.abs(ball.vy):Math.abs(ball.vy)
          break
        }
      }
      if(alive===0) state='win'
      particles=particles.filter(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.03
        ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x-3,p.y-3,6,6);return p.life>0
      }); ctx.globalAlpha=1
      for(const b of bricks){
        if(!b.alive) continue
        ctx.fillStyle=b.hits>1?b.color+'88':b.color; ctx.fillRect(b.x,b.y,b.w,b.h)
        ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(b.x+1,b.y+1,b.w-2,5)
        if(b.hits>1){ctx.strokeStyle='#fff4';ctx.lineWidth=2;ctx.strokeRect(b.x+2,b.y+2,b.w-4,b.h-4)}
      }
      ctx.fillStyle='#6366f1';ctx.fillRect(paddle.x,paddle.y,paddle.w,paddle.h)
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(paddle.x+2,paddle.y+2,paddle.w-4,4)
      ctx.beginPath();ctx.arc(ball.x,ball.y,R,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill()
      ctx.beginPath();ctx.arc(ball.x,ball.y,R+5,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fill()
      ctx.fillStyle='#bbb';ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.fillText('SCORE: '+score,10,28)
      ctx.textAlign='right';ctx.fillStyle='#ef4444';ctx.fillText('♥'.repeat(lives),W-10,28)
    }
    loop()
    return () => { cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku) }
  },[])
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#000',gap:10}}><canvas ref={ref} style={{border:'2px solid #222',display:'block',maxWidth:'100%'}} /><p style={{color:'#333',fontSize:11,fontFamily:'monospace'}}>SPACE to start  •  MOUSE or ←→ keys to move paddle</p></div>
}
`

const DASHBOARD_FILES: Record<string, string> = {
  'src/App.tsx': `
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import Analytics from './components/Analytics'
import Team from './components/Team'
type Page = 'overview'|'analytics'|'team'
export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const views: Record<Page, JSX.Element> = { overview: <Overview />, analytics: <Analytics />, team: <Team /> }
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',color:'#e2e8f0',fontFamily:'Inter,ui-sans-serif,sans-serif'}}>
      <Sidebar page={page} onNav={(p:Page)=>setPage(p)} />
      <main style={{flex:1,overflow:'auto'}}>
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>
            {views[page]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}`,
  'src/components/Sidebar.tsx': `
import { LayoutDashboard, BarChart2, Users, Zap } from 'lucide-react'
const items = [
  {id:'overview',icon:LayoutDashboard,label:'Overview'},
  {id:'analytics',icon:BarChart2,label:'Analytics'},
  {id:'team',icon:Users,label:'Team'},
]
export default function Sidebar({page,onNav}:{page:string;onNav:(p:any)=>void}) {
  return (
    <aside style={{width:200,borderRight:'1px solid #1c1c28',padding:'20px 10px',display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
      <div style={{padding:'4px 10px',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
        <Zap size={18} color="#6366f1" />
        <span style={{fontSize:16,fontWeight:700,color:'#6366f1'}}>WyberAI</span>
      </div>
      {items.map(it=>{
        const Icon=it.icon, active=page===it.id
        return <button key={it.id} onClick={()=>onNav(it.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,border:'none',background:active?'#6366f1':'transparent',color:active?'#fff':'#888',cursor:'pointer',fontSize:13,width:'100%',textAlign:'left',transition:'all .15s'}} onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.background='#ffffff12'}} onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.background='transparent'}}>
          <Icon size={15} />{it.label}
        </button>
      })}
    </aside>
  )
}`,
  'src/components/Overview.tsx': `
import { motion } from 'framer-motion'
import { DollarSign, Users, Zap, TrendingUp } from 'lucide-react'
const stats = [
  {label:'Revenue',value:'$48,592',change:'+12%',icon:DollarSign,color:'#6366f1'},
  {label:'Users',value:'8,241',change:'+8%',icon:Users,color:'#22c55e'},
  {label:'Builds',value:'1,039',change:'+23%',icon:Zap,color:'#f97316'},
  {label:'Growth',value:'18.4%',change:'+4%',icon:TrendingUp,color:'#3b82f6'},
]
const recent = [
  {app:'TaskFlow Pro',user:'Raj M.',status:'published',time:'2m ago'},
  {app:'Budget Buddy',user:'Priya S.',status:'building',time:'8m ago'},
  {app:'StockWatch',user:'Alex C.',status:'published',time:'15m ago'},
  {app:'FitTracker',user:'Maya T.',status:'draft',time:'1h ago'},
]
const statusColor:Record<string,string> = {published:'#22c55e',building:'#f97316',draft:'#666'}
export default function Overview() {
  return (
    <div style={{padding:'32px 36px'}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:24}}>Good morning, builder 👋</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
        {stats.map((s,i)=>{
          const Icon=s.icon
          return <motion.div key={s.label} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} style={{background:'#131320',borderRadius:12,padding:20,border:'1px solid #1e1e30'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <span style={{color:'#777',fontSize:12}}>{s.label}</span>
              <div style={{width:30,height:30,borderRadius:8,background:s.color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon size={14} color={s.color} />
              </div>
            </div>
            <div style={{fontSize:22,fontWeight:700}}>{s.value}</div>
            <div style={{fontSize:11,color:'#22c55e',marginTop:4}}>{s.change} this month</div>
          </motion.div>
        })}
      </div>
      <div style={{background:'#131320',borderRadius:12,border:'1px solid #1e1e30',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #1e1e30',fontSize:13,fontWeight:600,color:'#aaa'}}>Recent Activity</div>
        {recent.map((r,i)=>(
          <motion.div key={r.app} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.2+i*.06}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid #0e0e1a'}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{r.app}</div>
              <div style={{color:'#555',fontSize:11,marginTop:2}}>{r.user}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <span style={{fontSize:11,color:statusColor[r.status],background:statusColor[r.status]+'22',padding:'3px 10px',borderRadius:20}}>{r.status}</span>
              <span style={{color:'#444',fontSize:11}}>{r.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}`,
  'src/components/Analytics.tsx': `
import { LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,BarChart,Bar,Legend } from 'recharts'
const monthly = [
  {m:'Jan',revenue:12000,users:3200},{m:'Feb',revenue:18000,users:4100},
  {m:'Mar',revenue:22000,users:5800},{m:'Apr',revenue:19000,users:5200},
  {m:'May',revenue:31000,users:7100},{m:'Jun',revenue:28000,users:6900},
  {m:'Jul',revenue:38000,users:8241},
]
const daily = [
  {d:'Mon',builds:120},{d:'Tue',builds:185},{d:'Wed',builds:143},
  {d:'Thu',builds:210},{d:'Fri',builds:195},{d:'Sat',builds:98},{d:'Sun',builds:67},
]
const TS = {contentStyle:{background:'#131320',border:'1px solid #2a2a3e',borderRadius:8,fontSize:12},labelStyle:{color:'#aaa'}}
export default function Analytics() {
  return (
    <div style={{padding:'32px 36px'}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:24}}>Analytics</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{background:'#131320',borderRadius:12,padding:24,border:'1px solid #1e1e30'}}>
          <h2 style={{fontSize:13,marginBottom:20,color:'#888',fontWeight:600}}>REVENUE & USERS (2024)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="m" stroke="#444" tick={{fill:'#666',fontSize:11}} />
              <YAxis stroke="#444" tick={{fill:'#666',fontSize:11}} />
              <Tooltip {...TS} />
              <Legend wrapperStyle={{fontSize:11,color:'#666'}} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{fill:'#6366f1',r:3}} />
              <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={{fill:'#22c55e',r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'#131320',borderRadius:12,padding:24,border:'1px solid #1e1e30'}}>
          <h2 style={{fontSize:13,marginBottom:20,color:'#888',fontWeight:600}}>BUILDS THIS WEEK</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="d" stroke="#444" tick={{fill:'#666',fontSize:11}} />
              <YAxis stroke="#444" tick={{fill:'#666',fontSize:11}} />
              <Tooltip {...TS} />
              <Bar dataKey="builds" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}`,
  'src/components/Team.tsx': `
import { motion } from 'framer-motion'
import { Github, Twitter } from 'lucide-react'
const team = [
  {name:'Alex Chen',role:'Engineering Lead',avatar:'AC',color:'#6366f1',apps:42},
  {name:'Priya Sharma',role:'Product Designer',avatar:'PS',color:'#22c55e',apps:28},
  {name:'Marcus Webb',role:'Backend Engineer',avatar:'MW',color:'#f97316',apps:35},
  {name:'Sofia Torres',role:'Frontend Engineer',avatar:'ST',color:'#3b82f6',apps:51},
  {name:'Raj Patel',role:'DevOps Engineer',avatar:'RP',color:'#ec4899',apps:19},
  {name:'Yuki Tanaka',role:'ML Engineer',avatar:'YT',color:'#a855f7',apps:23},
]
export default function Team() {
  return (
    <div style={{padding:'32px 36px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700}}>Team</h1>
        <button style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,cursor:'pointer'}}>+ Invite</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {team.map((m,i)=>(
          <motion.div key={m.name} initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{delay:i*.07}} style={{background:'#131320',borderRadius:12,padding:20,border:'1px solid #1e1e30'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:m.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>{m.avatar}</div>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{color:'#555',fontSize:11,marginTop:2}}>{m.role}</div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #1e1e30',paddingTop:12}}>
              <span style={{fontSize:11,color:'#666'}}>{m.apps} apps built</span>
              <div style={{display:'flex',gap:10}}>
                <Github size={13} color="#444" style={{cursor:'pointer'}} />
                <Twitter size={13} color="#444" style={{cursor:'pointer'}} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}`,
}

// GET: self-test — pass ?type=game for canvas game, default = React counter
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  const testFiles: Record<string, string> =
    type === 'asteroids' ? { 'src/App.tsx': ASTEROIDS_APP } :
    type === 'focusflow' ? FOCUSFLOW_FILES :
    type === 'insta' ? INSTA_FULL :
    type === 'breakout' ? { 'src/App.tsx': BREAKOUT_APP } :
    type === 'dashboard' ? DASHBOARD_FILES :
    type === 'todo' ? {
    'src/App.tsx': `
import { useState } from 'react'
import { motion } from 'framer-motion'
export default function App() {
  const [items, setItems] = useState(['Buy groceries', 'Build app', 'Ship it'])
  const [input, setInput] = useState('')
  const add = () => { if (input.trim()) { setItems(i => [...i, input]); setInput('') } }
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Todo — framer-motion ✓</h1>
      <div className="flex gap-2 mb-4">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add task..." className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none border border-gray-700" />
        <button onClick={add} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500">Add</button>
      </div>
      {items.map((item,i) => (
        <motion.div key={item+i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}} className="bg-gray-800 p-4 rounded-lg mb-2 text-gray-200">
          {item}
        </motion.div>
      ))}
    </div>
  )
}`,
  } : type === 'game' ? {
    'src/App.tsx': `
import { useEffect, useRef } from 'react'
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    let x = canvas.width / 2, y = canvas.height / 2
    let vx = 3, vy = 2, r = 20, score = 0, raf: number
    const BALL_COLOR = '#6366f1', BG = '#09090b', TEXT = '#fff'
    function draw() {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height)
      x += vx; y += vy
      if (x + r > canvas.width || x - r < 0) { vx = -vx; score++ }
      if (y + r > canvas.height || y - r < 0) { vy = -vy; score++ }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = BALL_COLOR; ctx.fill()
      ctx.fillStyle = TEXT; ctx.font = 'bold 20px sans-serif'
      ctx.fillText('Bounces: ' + score, 16, 36)
      ctx.fillStyle = '#555'; ctx.font = '14px sans-serif'
      ctx.fillText('Canvas game — local build ✓', 16, canvas.height - 16)
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%'}} />
}`,
  } : {
    'src/App.tsx': `
import { useState } from 'react'
export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{padding:32,fontFamily:'sans-serif',textAlign:'center'}}>
      <h1 style={{fontSize:24,marginBottom:16}}>Local Preview Test ✓</h1>
      <p style={{marginBottom:16}}>Count: <strong>{count}</strong></p>
      <button onClick={()=>setCount(c=>c+1)} style={{padding:'8px 24px',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:16}}>
        Click me
      </button>
      <p style={{marginTop:24,color:'#888',fontSize:13}}>Built by local /api/web-bundle — no external server</p>
    </div>
  )
}`,
  }
  const { html, error } = await bundleAndHtml(testFiles, 'self-test')
  if (error && !html) return new Response(error, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { files?: Record<string, {content?: string} | string>; projectId?: string }
    const projectId = body.projectId || 'preview'

    const fileMap: Record<string, string> = {}
    for (const [path, file] of Object.entries(body.files || {})) {
      const content = typeof file === 'string' ? file : file?.content
      if (content) fileMap[path] = content
    }

    if (Object.keys(fileMap).length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const { html, error } = await bundleAndHtml(fileMap, projectId)
    return NextResponse.json({ html, error })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
