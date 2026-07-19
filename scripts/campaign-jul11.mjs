// WyberAi — Jul 11 campaign: feature carousel + trust/security carousel.
// Renders every slide at 1080x1350 (LinkedIn document / IG carousel) and a
// condensed 1080x1080 set for X, then assembles the 4:5 PNGs into a LinkedIn
// PDF. Same headless-Chrome pattern as scripts/social-assets.mjs.
// Output: OneDrive\Desktop\Wyber Ai\campaign-jul11\{feature,trust}\
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'campaign-jul11')

// ---- brand primitives -------------------------------------------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:#f4f4f5}.sky{color:#0EA5E9}.red{color:#f87171}.grn{color:#4ade80}.amb{color:#fbbf24}.dim{color:#a1a1aa}.faint{color:#71717a}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m * 0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const GLOW = `background:#09090b;background-image:radial-gradient(ellipse 90% 42% at 50% 0%, rgba(14,165,233,0.14) 0%, transparent 62%)`
const GLOW_RED = `background:#09090b;background-image:radial-gradient(ellipse 90% 42% at 50% 0%, rgba(239,68,68,0.13) 0%, transparent 62%)`

// ---- slide scaffold ---------------------------------------------------------
// k scales type/spacing so the same slide works at 4:5 (k=1) and 1:1 (k=0.82).
const scaffold = (w, h, k, bg, { kicker, kickerColor = '#0EA5E9', headline, hk = 1, sub, visual, footer, index, total }) => {
  const p = Math.round(84 * k)
  const dots = index != null
    ? `<div style="display:flex;gap:10px">${Array.from({ length: total }, (_, i) =>
        `<div style="width:${i === index ? 30 : 10}px;height:10px;border-radius:5px;background:${i === index ? '#0EA5E9' : 'rgba(255,255,255,0.16)'}"></div>`).join('')}</div>`
    : ''
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head>
<body style="width:${w}px;height:${h}px;${bg}">
<div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:${p}px ${p}px ${Math.round(p * 0.8)}px">
  <div style="display:flex;align-items:center;justify-content:space-between">
    ${lockup(Math.round(52 * k), Math.round(36 * k))}
    ${index != null ? `<div class="mono faint" style="font-size:${Math.round(24 * k)}px">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>` : ''}
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:${Math.round(34 * k)}px">
    ${kicker ? `<div class="mono" style="font-size:${Math.round(24 * k)}px;letter-spacing:.16em;color:${kickerColor}">${kicker}</div>` : ''}
    <div style="font-weight:800;font-size:${Math.round(78 * k * hk)}px;letter-spacing:-0.045em;line-height:1.06">${headline}</div>
    ${sub ? `<div class="dim" style="font-size:${Math.round(33 * k)}px;line-height:1.5;max-width:${Math.round(880 * k)}px">${sub}</div>` : ''}
    ${visual ? `<div style="margin-top:${Math.round(14 * k)}px">${visual}</div>` : ''}
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between">
    ${dots}
    ${footer || `<div class="mono faint" style="font-size:${Math.round(22 * k)}px">wyberai.com</div>`}
  </div>
</div>
</body></html>`
}

// ---- CSS mock visuals -------------------------------------------------------
const card = (k, inner, extra = '') => `<div style="border:1px solid rgba(255,255,255,0.09);border-radius:${Math.round(20 * k)}px;background:rgba(255,255,255,0.03);padding:${Math.round(28 * k)}px;${extra}">${inner}</div>`

const themesVisual = (k) => {
  const sw = (name, cols, active) => `<div style="flex:1;border:1.5px solid ${active ? '#0EA5E9' : 'rgba(255,255,255,0.1)'};border-radius:${Math.round(18 * k)}px;padding:${Math.round(22 * k)}px;background:${active ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.02)'}">
    <div style="display:flex;gap:${Math.round(8 * k)}px;margin-bottom:${Math.round(16 * k)}px">${cols.map(c => `<div style="width:${Math.round(26 * k)}px;height:${Math.round(26 * k)}px;border-radius:50%;background:${c}"></div>`).join('')}</div>
    <div style="font-size:${Math.round(24 * k)}px;font-weight:600">${name}</div>
    ${active ? `<div class="mono sky" style="font-size:${Math.round(17 * k)}px;margin-top:${Math.round(8 * k)}px">✓ APPLIED</div>` : `<div style="height:${Math.round(25 * k)}px"></div>`}
  </div>`
  return `<div style="display:flex;gap:${Math.round(18 * k)}px">
    ${sw('Midnight', ['#0EA5E9', '#09090b', '#f4f4f5'], true)}
    ${sw('Porcelain', ['#18181b', '#fafafa', '#e4e4e7'], false)}
    ${sw('Verdant', ['#22c55e', '#052e16', '#f0fdf4'], false)}
    ${sw('Ember', ['#f97316', '#1c1917', '#fff7ed'], false)}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-top:${Math.round(18 * k)}px"><div class="mono" style="font-size:${Math.round(20 * k)}px;color:#4ade80;border:1px solid rgba(74,222,128,.3);border-radius:999px;padding:${Math.round(8 * k)}px ${Math.round(20 * k)}px">0 CREDITS</div></div>`
}

const visualEditsVisual = (k) => card(k, `
  <div style="position:relative;display:flex;flex-direction:column;gap:${Math.round(18 * k)}px">
    <div style="height:${Math.round(16 * k)}px;width:38%;border-radius:8px;background:rgba(255,255,255,0.12)"></div>
    <div style="height:${Math.round(16 * k)}px;width:62%;border-radius:8px;background:rgba(255,255,255,0.07)"></div>
    <div style="position:relative;display:inline-flex;align-self:flex-start;margin-top:${Math.round(6 * k)}px">
      <div style="font-weight:700;font-size:${Math.round(26 * k)}px;color:#fff;background:#0EA5E9;border-radius:${Math.round(12 * k)}px;padding:${Math.round(14 * k)}px ${Math.round(34 * k)}px">Get started</div>
      <div style="position:absolute;inset:${-Math.round(10 * k)}px;border:2px dashed #0EA5E9;border-radius:${Math.round(16 * k)}px"></div>
      <div style="position:absolute;left:105%;top:50%;transform:translateY(-50%);white-space:nowrap;margin-left:${Math.round(26 * k)}px;border:1px solid rgba(255,255,255,0.12);background:#18181b;border-radius:${Math.round(14 * k)}px;padding:${Math.round(16 * k)}px ${Math.round(22 * k)}px;display:flex;align-items:center;gap:${Math.round(14 * k)}px">
        <span class="mono faint" style="font-size:${Math.round(19 * k)}px">text</span><span style="font-size:${Math.round(21 * k)}px">Start free →</span>
        <span style="display:inline-flex;gap:${Math.round(6 * k)}px">${['#0EA5E9', '#a855f7', '#22c55e'].map(c => `<span style="width:${Math.round(20 * k)}px;height:${Math.round(20 * k)}px;border-radius:50%;background:${c}"></span>`).join('')}</span>
      </div>
    </div>
    <div class="mono grn" style="font-size:${Math.round(19 * k)}px;margin-top:${Math.round(10 * k)}px">✓ applied instantly · 0 credits</div>
  </div>`)

const imagesVisual = (k) => {
  const tile = (g) => `<div style="flex:1;aspect-ratio:4/3;border-radius:${Math.round(16 * k)}px;background:${g}"></div>`
  return card(k, `<div style="display:flex;gap:${Math.round(16 * k)}px">
    ${tile('linear-gradient(135deg,#0c4a6e,#0EA5E9)')}
    ${tile('linear-gradient(135deg,#3b0764,#a855f7)')}
    ${tile('linear-gradient(135deg,#052e16,#22c55e)')}
    <div style="flex:1;aspect-ratio:4/3;border-radius:${Math.round(16 * k)}px;border:2px dashed rgba(14,165,233,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(8 * k)}px"><div class="sky" style="font-size:${Math.round(40 * k)}px;line-height:1">+</div><div class="mono sky" style="font-size:${Math.round(17 * k)}px">ADD</div></div>
  </div>`)
}

const kitVisual = (k) => {
  const chips = ['Bento grid', 'Pricing table', 'Testimonials', 'Hero', 'Stats band', 'Navbar', 'FAQ accordion', 'Feature rail', 'Logo cloud', 'Footer', 'CTA banner', '+ 20 more']
  return `<div style="display:flex;flex-wrap:wrap;gap:${Math.round(14 * k)}px;max-width:${Math.round(900 * k)}px">${chips.map((c, i) =>
    `<div class="mono" style="font-size:${Math.round(21 * k)}px;color:${i === chips.length - 1 ? '#0EA5E9' : '#d4d4d8'};border:1px solid ${i === chips.length - 1 ? 'rgba(14,165,233,.45)' : 'rgba(255,255,255,0.11)'};border-radius:999px;padding:${Math.round(11 * k)}px ${Math.round(22 * k)}px;background:rgba(255,255,255,0.02)">${c}</div>`).join('')}</div>`
}

const mobileVisual = (k) => `
  <div style="display:flex;align-items:center;gap:${Math.round(44 * k)}px">
    <div style="width:${Math.round(230 * k)}px;height:${Math.round(470 * k)}px;border:3px solid rgba(255,255,255,0.16);border-radius:${Math.round(40 * k)}px;padding:${Math.round(14 * k)}px;background:#0c0c0e">
      <div style="width:100%;height:100%;border-radius:${Math.round(28 * k)}px;background:#111114;padding:${Math.round(16 * k)}px;display:flex;flex-direction:column;gap:${Math.round(12 * k)}px">
        <div style="height:${Math.round(30 * k)}px;border-radius:8px;background:rgba(14,165,233,0.35)"></div>
        <div style="height:${Math.round(70 * k)}px;border-radius:10px;background:rgba(255,255,255,0.07)"></div>
        <div style="height:${Math.round(70 * k)}px;border-radius:10px;background:rgba(255,255,255,0.05)"></div>
        <div style="height:${Math.round(70 * k)}px;border-radius:10px;background:rgba(255,255,255,0.04)"></div>
        <div style="margin-top:auto;height:${Math.round(38 * k)}px;border-radius:10px;background:#0EA5E9;opacity:.85"></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:${Math.round(16 * k)}px">
      ${['iPhone 17', 'Pixel 10', 'Galaxy S26'].map((d, i) => `<div class="mono" style="font-size:${Math.round(22 * k)}px;color:${i === 0 ? '#0EA5E9' : '#71717a'};border:1px solid ${i === 0 ? 'rgba(14,165,233,.45)' : 'rgba(255,255,255,0.1)'};border-radius:999px;padding:${Math.round(12 * k)}px ${Math.round(26 * k)}px;background:${i === 0 ? 'rgba(14,165,233,.07)' : 'transparent'}">${d}</div>`).join('')}
    </div>
  </div>`

const leakVisual = (k) => card(k, `<div class="mono" style="font-size:${Math.round(23 * k)}px;line-height:2.05">
  <div class="faint">$ curl https://xyz.supabase.co/rest/v1/users \\</div>
  <div class="faint">&nbsp;&nbsp;-H "apikey: &lt;public anon key&gt;"</div>
  <div><span class="red">→ 200 OK</span> &nbsp;<span class="dim">1,204 rows</span> &nbsp;<span class="red">no login required</span></div>
  <div class="dim">emails, phone numbers, order history…</div>
</div>`, 'border-color:rgba(239,68,68,0.25)')

const scanVisual = (k) => card(k, `<div class="mono" style="font-size:${Math.round(23 * k)}px;line-height:2.05">
  <div class="dim">$ wyber security scan <span class="faint">— probing with your public key</span></div>
  <div><span class="grn">✓</span> orders &nbsp;<span class="faint">protected — 0 rows readable</span></div>
  <div><span class="grn">✓</span> profiles &nbsp;<span class="faint">protected — 0 rows readable</span></div>
  <div><span class="red">✗ CRITICAL</span> messages &nbsp;<span class="dim">312 rows readable by anyone</span></div>
  <div class="sky">→ fix generated · one click to apply</div>
</div>`)

const gateVisual = (k) => card(k, `
  <div style="display:flex;flex-direction:column;gap:${Math.round(20 * k)}px">
    <div style="display:flex;align-items:center;gap:${Math.round(14 * k)}px">
      <div style="width:${Math.round(40 * k)}px;height:${Math.round(40 * k)}px;border-radius:50%;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;color:#f87171;font-size:${Math.round(24 * k)}px;font-weight:800">!</div>
      <div style="font-weight:700;font-size:${Math.round(30 * k)}px">Publish blocked</div>
    </div>
    <div class="dim" style="font-size:${Math.round(24 * k)}px;line-height:1.55">1 critical data leak · 1 exposed secret.<br>Fix the issues to ship — or override explicitly.</div>
    <div style="display:flex;gap:${Math.round(16 * k)}px">
      <div style="font-weight:700;font-size:${Math.round(23 * k)}px;color:#fff;background:#0EA5E9;border-radius:${Math.round(12 * k)}px;padding:${Math.round(13 * k)}px ${Math.round(30 * k)}px">Fix issues</div>
      <div style="font-size:${Math.round(23 * k)}px;color:#71717a;border:1px solid rgba(255,255,255,0.12);border-radius:${Math.round(12 * k)}px;padding:${Math.round(13 * k)}px ${Math.round(30 * k)}px">Publish anyway</div>
    </div>
  </div>`, 'max-width:760px')

const hardenVisual = (k) => `<div style="display:flex;flex-direction:column;gap:${Math.round(18 * k)}px;max-width:${Math.round(880 * k)}px">
  ${[['Crash guards', 'error boundaries injected into every app — one bad component never blanks the page'],
     ['Secret scanning', 'API keys and tokens caught before they reach your published bundle'],
     ['Rate-limited APIs', 'publish, deploy and export endpoints are abuse-protected']]
    .map(([t, d]) => `<div style="display:flex;gap:${Math.round(22 * k)}px;align-items:flex-start;border:1px solid rgba(255,255,255,0.08);border-radius:${Math.round(18 * k)}px;padding:${Math.round(22 * k)}px ${Math.round(26 * k)}px"><div class="grn" style="font-size:${Math.round(28 * k)}px;line-height:1.3">✓</div><div><div style="font-weight:700;font-size:${Math.round(28 * k)}px">${t}</div><div class="dim" style="font-size:${Math.round(23 * k)}px;line-height:1.45;margin-top:${Math.round(6 * k)}px">${d}</div></div></div>`).join('')}
</div>`

// ---- carousels --------------------------------------------------------------
const FEATURE = [
  { bg: GLOW, kicker: 'PRODUCT UPDATE · JULY 2026', headline: `Your builds just got<br>a <span class="sky">serious upgrade</span>.`, sub: '5 new editor features. Live for everyone, today.', footer: `<div class="mono sky" style="font-size:22px">SWIPE →</div>` },
  { bg: GLOW, kicker: '01 · THEMES', headline: `Restyle your entire app<br>in <span class="sky">one click</span>.`, sub: 'Swap the whole look — colors, fonts, radius. Costs nothing.', visual: themesVisual },
  { bg: GLOW, kicker: '02 · VISUAL EDITS', headline: `Click anything.<br>Change it <span class="sky">instantly</span>.`, sub: 'Text, colors, spacing — edited in place. No AI round-trip, no waiting.', visual: visualEditsVisual },
  { bg: GLOW, kicker: '03 · IMAGES PANEL', headline: `Real images, straight<br>into your app.`, sub: 'Search, upload and place images without leaving the editor.', visual: imagesVisual },
  { bg: GLOW, kicker: '04 · WYBER UI KIT', headline: `<span class="sky">31 premium components</span><br>in every build.`, sub: 'Bento grids, pricing tables, testimonial walls — your app looks designed, not generated.', visual: kitVisual },
  { bg: GLOW, kicker: '05 · MOBILE PREVIEW', headline: `See your app on real<br>devices — <span class="sky">in the editor</span>.`, sub: 'Live preview on current-gen frames while you build.', visual: mobileVisual },
  { bg: GLOW, kicker: 'WYBERAI', headline: `One prompt.<br>Web <span class="sky">and</span> mobile apps.`, sub: 'Free to start · security-scanned · code you own', footer: `<div class="mono" style="font-size:24px;color:#fff;background:#0EA5E9;border-radius:999px;padding:14px 34px">wyberai.com</div>` },
]

const TRUST = [
  { bg: GLOW_RED, kicker: 'SECURITY', kickerColor: '#f87171', headline: `AI-built apps are<br><span class="red">leaking user data</span>.`, sub: `Here's how we make sure yours doesn't.`, footer: `<div class="mono sky" style="font-size:22px">SWIPE →</div>` },
  { bg: GLOW_RED, kicker: 'THE PROBLEM', kickerColor: '#f87171', headline: `Most vibe-coded apps ship<br>with an <span class="red">open database</span>.`, hk: 0.87, sub: 'Anyone with your public API key can read what your users saved. No hack needed — just a URL.', visual: leakVisual },
  { bg: GLOW, kicker: 'OUR FIX · SECURITY SCAN', headline: `We attack your app<br><span class="sky">before anyone else can</span>.`, sub: `The scanner probes your live database with the public key — the attacker's view, not a static checklist.`, visual: scanVisual },
  { bg: GLOW, kicker: 'PUBLISH GATE', headline: `Critical leaks<br><span class="sky">block publish</span>.`, sub: 'Readable private data and exposed secrets stop the ship button until fixed.', visual: gateVisual },
  { bg: GLOW, kicker: 'BUILT-IN HARDENING', headline: `Every build<br>ships <span class="sky">hardened</span>.`, visual: hardenVisual },
  { bg: GLOW, kicker: 'WYBERAI', headline: `<span class="sky">Scanned</span> before<br>it ships.`, sub: 'Build web & mobile apps with AI — with a security engineer built in.', footer: `<div class="mono" style="font-size:24px;color:#fff;background:#0EA5E9;border-radius:999px;padding:14px 34px">wyberai.com</div>` },
]

// X gets the 4 strongest inner slides (the tweet itself plays cover/CTA)
const X_PICKS = { feature: [1, 2, 4, 5], trust: [1, 2, 3, 4] }

// ---- render -----------------------------------------------------------------
const sets = { feature: FEATURE, trust: TRUST }
for (const name of Object.keys(sets)) {
  fs.mkdirSync(path.join(OUT, name, 'linkedin-ig-4x5'), { recursive: true })
  fs.mkdirSync(path.join(OUT, name, 'x-1x1'), { recursive: true })
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()

async function shot(html, w, h, outPath) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await page.evaluate(() => document.fonts.check('800 40px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 250))
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: w, height: h } })
  console.log('✓', path.relative(OUT, outPath), interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')
}

for (const [name, slides] of Object.entries(sets)) {
  // 4:5 full set
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]
    const html = scaffold(1080, 1350, 1, s.bg, { ...s, visual: s.visual ? s.visual(1) : null, index: i, total: slides.length })
    await shot(html, 1080, 1350, path.join(OUT, name, 'linkedin-ig-4x5', `${name}-${String(i + 1).padStart(2, '0')}.png`))
  }
  // 1:1 condensed X set
  for (const i of X_PICKS[name]) {
    const s = slides[i], k = 0.82
    const html = scaffold(1080, 1080, k, s.bg, { ...s, visual: s.visual ? s.visual(k) : null, index: null })
    await shot(html, 1080, 1080, path.join(OUT, name, 'x-1x1', `${name}-x-${String(i + 1).padStart(2, '0')}.png`))
  }
  // LinkedIn PDF from the rendered 4:5 PNGs (pixel-identical to the verified images)
  const dir = path.join(OUT, name, 'linkedin-ig-4x5')
  const imgs = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort()
  const pdfHtml = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}@page{size:1080px 1350px;margin:0}img{display:block;width:1080px;height:1350px;page-break-after:always}</style></head><body>${imgs.map(f => `<img src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}">`).join('')}</body></html>`
  await page.setContent(pdfHtml, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise(r => setTimeout(r, 1000))
  await page.pdf({ path: path.join(OUT, name, `wyberai-${name}-carousel.pdf`), width: '1080px', height: '1350px', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
  console.log('✓', `${name}/wyberai-${name}-carousel.pdf`, `(${imgs.length} pages)`)
}

await browser.close()
console.log('\nAll assets in:', OUT)
