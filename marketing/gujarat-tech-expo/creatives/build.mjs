// Builds the Tech Expo Gujarat creative set (carousel, story, ads) as HTML, renders PNGs with headless Chrome.
// Usage: node marketing/gujarat-tech-expo/creatives/build.mjs
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT = path.join(ROOT, 'out', 'v2')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b64 = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64')
const ICON = b64(path.join(ROOT, 'wyberai-icon-1024.png'))
const LOGO = b64(path.join(ROOT, 'tech-expo-logo.png'))

export const CSS = `
:root{--bg:#05060a;--raised:#0a0c14;--accent:#0ea5e9;--hot:#38bdf8;--text:#e6edf6;--dim:#8b94a7;--faint:#5b6477;--border:rgba(255,255,255,.14);--mono:'JetBrains Mono',ui-monospace,monospace;--sans:'Inter',system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);font-family:var(--sans);color:var(--text);-webkit-font-smoothing:antialiased}
.s{position:relative;width:1080px;overflow:hidden;display:flex;flex-direction:column;
  background:radial-gradient(ellipse 80% 45% at 90% -5%,rgba(14,165,233,.22),transparent 62%),radial-gradient(ellipse 70% 35% at 0% 105%,rgba(14,165,233,.10),transparent 60%),var(--bg)}
.top{display:flex;justify-content:space-between;align-items:center}
.lockup{display:flex;align-items:center;gap:18px;font-weight:900;font-size:54px;letter-spacing:-.04em}
.lockup img{width:76px;height:76px;border-radius:18px}.lockup b{color:var(--accent)}
.tag{font-family:var(--mono);font-weight:700;font-size:23px;letter-spacing:.2em;color:var(--hot);display:flex;align-items:center;gap:12px;white-space:nowrap}
.tag::before{content:'';width:13px;height:13px;background:var(--accent);display:block}
.mono{font-family:var(--mono)}
h1,h2,h3{font-weight:900;letter-spacing:-.045em;line-height:.97}
h1{font-size:104px}h2{font-size:88px}h3{font-size:64px}
em{font-style:normal;color:var(--hot)}
.sub{font-weight:500;font-size:36px;line-height:1.32;letter-spacing:-.02em;color:var(--dim)}
.grid{display:grid;grid-template-columns:repeat(20,1fr);gap:8px}
.grid.g10{grid-template-columns:repeat(10,1fr);gap:6px}
.c{aspect-ratio:1;border-radius:7px;background:#10131c;border:1px solid rgba(255,255,255,.07)}
.c.on{background:var(--accent);border-color:var(--hot);box-shadow:0 0 30px rgba(14,165,233,.75)}
.c.q{background:transparent;border:2.5px dashed var(--hot);box-shadow:0 0 22px rgba(56,189,248,.4)}
.legend{display:flex;justify-content:space-between;font-family:var(--mono);font-weight:500;font-size:21px;letter-spacing:.12em;color:var(--faint);margin-bottom:16px}
.legend .lg{color:var(--hot)}
.logocard{background:#fff;border-radius:34px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.logocard img{display:block;height:92%}
.booth{background:var(--accent);border-radius:34px;color:#fff;padding:34px 40px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 30px 80px -20px rgba(14,165,233,.6)}
.booth small{font-family:var(--mono);font-weight:700;font-size:26px;letter-spacing:.2em;color:#032a40}
.booth b{font-weight:900;font-size:150px;letter-spacing:-.06em;line-height:.85}
.pill{align-self:flex-start;display:inline-flex;align-items:center;gap:18px;border:1.5px solid rgba(56,189,248,.4);background:rgba(14,165,233,.08);border-radius:20px;padding:20px 32px;font-weight:800;font-size:40px;letter-spacing:-.03em}
.btn{display:inline-flex;align-items:center;justify-content:center;background:var(--accent);color:#031420;font-weight:900;font-size:44px;letter-spacing:-.03em;border-radius:26px;padding:30px 54px;box-shadow:0 24px 60px -18px rgba(14,165,233,.8)}
.row{display:flex;align-items:center;gap:30px;padding:26px 0;border-top:1.5px solid var(--border)}
.row:last-child{border-bottom:1.5px solid var(--border)}
.row .n{font-family:var(--mono);font-weight:700;font-size:26px;letter-spacing:.14em;color:var(--hot);width:64px}
.row .t{font-weight:900;font-size:60px;letter-spacing:-.04em;line-height:1}
.row .t i{font-style:normal;font-weight:500;color:var(--dim);font-size:34px;letter-spacing:-.02em;display:block;margin-top:8px}
.foot{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:25px;letter-spacing:.06em;color:var(--dim);border-top:1.5px solid var(--border);padding-top:26px}
.foot b{color:var(--text);font-weight:700}.foot .u em{color:var(--hot)}
.card{border:1.5px solid var(--border);border-radius:28px;background:var(--raised);padding:30px}
.chip{display:flex;align-items:center;gap:26px;border:1.5px solid var(--border);background:var(--raised);border-radius:26px;padding:26px 34px;font-weight:900;font-size:56px;letter-spacing:-.04em}
.chip .k{font-family:var(--mono);font-weight:700;font-size:24px;letter-spacing:.14em;color:var(--hot)}
.chip.hot{border-color:rgba(56,189,248,.6);background:rgba(14,165,233,.1)}
`

const LIT = [7, 23, 41, 58, 86]
const QUESTION = 66
function grid(opts = {}) {
  const { cols = 20, n = 100, lit = LIT, q = null } = opts
  let h = `<div class="grid${cols === 10 ? ' g10' : ''}">`
  for (let i = 0; i < n; i++) h += `<div class="c${lit.includes(i) ? ' on' : ''}${q === i ? ' q' : ''}"></div>`
  return h + '</div>'
}
const lockup = () => `<div class="lockup"><img src="${ICON}" alt=""><span>Wyber<b>Ai</b></span></div>`
const tag = t => `<div class="tag">${t}</div>`
const footLine = (left = 'Booth <b>S23</b> · 27–29 Nov', right = 'wyberai.com<em>/expo</em>') => `<div class="foot"><span>${left}</span><span class="u">${right}</span></div>`
const legend = (a = '100 FEATURES YOU PAY FOR', b = '■ 5 YOU USE') => `<div class="legend"><span>${a}</span><span class="lg">${b}</span></div>`

const page = (h, body, pad = [90, 80, 90]) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>${CSS}.s{height:${h}px;padding:${pad[0]}px ${pad[1]}px ${pad[2]}px}</style></head><body><div class="s">${body}</div></body></html>`

const sp = (px = 0) => `<div style="flex:${px || 1}"></div>`

const EVENT = 'TECH EXPO GUJARAT 2026'

/* ---------- organic: carousel (1080x1350) and story (1080x1920) ---------- */
function hook(h, pad) {
  const swipe = h > 1500 ? 'Booth <b>S23</b> · 27–29 Nov' : 'Swipe to see what we build'
  return page(h, `
    <div class="top">${lockup()}${tag('EXHIBITING')}</div>
    ${sp()}
    <div class="mono" style="font-weight:700;font-size:26px;letter-spacing:.2em;color:var(--hot);margin-bottom:30px">${EVENT} · BOOTH S23</div>
    <h1>Most software has<br>100 features.<br><em>You use 5.</em></h1>
    ${sp()}
    ${grid({ lit: [] })}
    <div style="height:34px"></div>
    ${footLine(swipe, 'wyberai.com<em>/expo</em>')}`, pad)
}
function slideGrid(h, pad) {
  return page(h, `
    <div class="top">${lockup()}${tag('WHAT YOU PAY FOR')}</div>
    ${sp()}
    <h2>You pay for all 100.<br><em>The one you need isn’t there.</em></h2>
    <div style="height:46px"></div>
    ${legend('100 FEATURES YOU PAY FOR', '■ 5 YOU USE  ▢ THE ONE YOU NEED')}
    ${grid({ q: QUESTION })}
    ${sp()}
    <p class="sub">So you keep paying for features you never open, and still work around the one that is missing.</p>
    ${sp(0.6)}
    ${footLine()}`, pad)
}
function slideFive(h, pad) {
  const rows = [['01', 'Web app', 'Tools for your team'], ['02', 'Website', 'Your business, online'], ['03', 'Mobile app', 'An app people install'], ['04', 'SaaS', 'A product you sell'], ['05', 'Your own version', 'Of a tool you pay for today']]
  return page(h, `
    <div class="top">${lockup()}${tag('TELL US WHAT YOU NEED')}</div>
    ${sp()}
    <h2 style="margin-bottom:46px">Tell us what<br>you need. <em>We build it.</em></h2>
    <div>${rows.map(r => `<div class="row"><span class="n">${r[0]}</span><span class="t">${r[1]}<i>${r[2]}</i></span></div>`).join('')}</div>
    ${sp()}
    ${footLine()}`, pad)
}
function slideHow(h, pad) {
  const steps = [['1', 'Say it in plain words', 'No forms, no spec. Just tell us what you want.'], ['2', 'Watch it get built', 'Live at the booth, in about 15 minutes.'], ['3', 'Keep the real code', 'Yours to take. No lock-in.']]
  return page(h, `
    <div class="top">${lockup()}${tag('AT THE BOOTH')}</div>
    ${sp()}
    <h2 style="margin-bottom:56px">We build it<br><em>live, in front of you.</em></h2>
    ${steps.map(s => `<div class="row" style="align-items:flex-start"><span class="n" style="font-size:44px;width:74px">${s[0]}</span><span class="t">${s[1]}<i>${s[2]}</i></span></div>`).join('')}
    ${sp()}
    ${footLine()}`, pad)
}
function cta(h, pad, ad = false) {
  return page(h, `
    <div class="top">${lockup()}${tag('SEE US AT')}</div>
    ${sp()}
    <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:24px;height:330px"><div class="logocard"><img src="${LOGO}" alt=""></div><div class="booth"><small>BOOTH</small><b>S23</b></div></div>
    <div style="height:54px"></div>
    <h2>Bring what you need.<br><em>We’ll build it live.</em></h2>
    <div style="height:44px"></div>
    <div class="pill">27–28–29 Nov, 2026</div>
    <p class="sub" style="margin-top:26px;color:var(--text);font-weight:800">GUCEC (GMDC Ground), Ahmedabad</p>
    ${sp()}
    <div style="display:flex;align-items:center;justify-content:space-between"><span class="btn">Book 15 minutes</span><span class="mono" style="font-size:30px;font-weight:700;letter-spacing:.04em">wyberai.com<em>/expo</em></span></div>`, pad)
}

/* ---------- ads: three angles, 4:5 and 9:16 ---------- */
const CTA_ROW = `<div style="display:flex;align-items:center;justify-content:space-between"><span class="btn">Book 15 minutes</span><span class="mono" style="font-size:28px;font-weight:700;letter-spacing:.04em;color:var(--dim)">Booth <b style="color:var(--text)">S23</b> · 27–29 Nov</span></div>`
function adHundred(h, pad) {
  return page(h, `
    <div class="top">${lockup()}${tag('TECH EXPO GUJARAT')}</div>
    ${sp()}
    <h1>Most software has<br>100 features.<br><em>Most people use 5.</em></h1>
    <div style="height:46px"></div>
    <p class="sub">Tell us what you actually need. We build it live at the booth.</p>
    ${sp()}
    ${grid()}
    <div style="height:40px"></div>
    ${CTA_ROW}`, pad)
}
function adReplace(h, pad) {
  return page(h, `
    <div class="top">${lockup()}${tag('TECH EXPO GUJARAT')}</div>
    ${sp()}
    <h1 style="font-size:96px">Paying for software you barely use?</h1>
    <div style="height:40px"></div>
    <p class="sub">We build your own version with only the features you use. Live, at the booth.</p>
    ${sp()}
    <div style="display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:14px">
      <div class="card"><div class="mono" style="font-size:20px;letter-spacing:.14em;color:var(--faint);margin-bottom:18px">THE TOOL YOU PAY FOR</div>${grid({ cols: 10, lit: [] })}</div>
      <div style="font-size:60px;color:var(--hot);text-align:center;font-weight:900">→</div>
      <div class="card" style="border-color:rgba(56,189,248,.6)"><div class="mono" style="font-size:20px;letter-spacing:.14em;color:var(--hot);margin-bottom:18px">YOURS</div>
        <div class="grid g10" style="grid-template-columns:repeat(5,1fr);gap:8px">${[0, 1, 2, 3, 4].map(() => '<div class="c on"></div>').join('')}</div>
        <div class="mono" style="font-size:20px;letter-spacing:.1em;color:var(--dim);margin-top:18px">ONLY WHAT YOU USE</div></div>
    </div>
    ${sp()}
    ${CTA_ROW}`, pad)
}
function adAnything(h, pad) {
  const items = ['Web app', 'Website', 'Mobile app', 'SaaS', 'Your own version of a tool']
  return page(h, `
    <div class="top">${lockup()}${tag('TECH EXPO GUJARAT')}</div>
    ${sp()}
    <h1 style="font-size:${h<1500?84:100}px">Tell us what you need.<br><em>We build it live.</em></h1>
    ${sp(0.7)}
    <div style="display:grid;gap:${h<1500?12:16}px">${items.map((t, i) => `<div style="${h<1500?'padding:18px 30px;font-size:48px':''}" class="chip${i === 4 ? ' hot' : ''}"><span class="k">0${i + 1}</span>${t}</div>`).join('')}</div>
    ${sp()}
    ${CTA_ROW}`, pad)
}

const jobs = []
const add = (dir, name, w, h, html) => jobs.push({ dir, name, w, h, html })
const C = [80, 80, 80]
// carousel 4:5
add('carousel', '1-hook', 1080, 1350, hook(1350, [86, 80, 70]))
add('carousel', '2-hundred', 1080, 1350, slideGrid(1350, [86, 80, 70]))
add('carousel', '3-five-things', 1080, 1350, slideFive(1350, [86, 80, 70]))
add('carousel', '4-how', 1080, 1350, slideHow(1350, [86, 80, 70]))
add('carousel', '5-booth', 1080, 1350, cta(1350, [86, 80, 80]))
// story 9:16 (safe zones top 170 / bottom 250)
add('story', '1-hook', 1080, 1920, hook(1920, [170, 80, 250]))
add('story', '2-five-things', 1080, 1920, slideFive(1920, [170, 80, 250]))
add('story', '3-booth', 1080, 1920, cta(1920, [170, 80, 250]))
// ads
for (const [key, fn] of [['A-hundred-vs-five', adHundred], ['B-replace-what-you-pay-for', adReplace], ['C-build-anything', adAnything]]) {
  add('ads', `${key}_feed-4x5`, 1080, 1350, fn(1350, [80, 80, 80]))
  add('ads', `${key}_story-9x16`, 1080, 1920, fn(1920, [170, 80, 260]))
}

const only = process.argv[2]
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
for (const j of jobs) {
  if (only && !`${j.dir}/${j.name}`.includes(only)) continue
  const dir = path.join(OUT, j.dir)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${j.name}.html`), j.html)
  const page = await browser.newPage()
  await page.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 1 })
  await page.setContent(j.html, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  const overflow = await page.evaluate(() => { const s = document.querySelector('.s'); return s.scrollHeight - s.clientHeight })
  await page.screenshot({ path: path.join(dir, `${j.name}.png`), clip: { x: 0, y: 0, width: j.w, height: j.h } })
  console.log(overflow > 2 ? `OVERFLOW ${overflow}px` : 'ok', `${j.dir}/${j.name}`)
  await page.close()
}
await browser.close()
