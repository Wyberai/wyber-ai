// WyberCode 1.0 launch carousel (3 slides, 1080x1350). Run from repo root: node docs/launch/creatives/build.cjs
// Logo is the real one from src/components/shared/WyberLogo.tsx (white chevrons on sky, "Wyber" + sky "Ai").
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const out = path.join(__dirname, 'out')
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true })
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))

const css = `
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--bg:#05080d;--card:#0d141e;--ink:#e8eef7;--ink2:#9aa8bb;--ink3:#8797ab;--line:rgba(150,190,235,.18);--brand:#0ea5e9;--hot:#38bdf8;--btn:#03111c}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;background:var(--bg);color:var(--ink);font-family:'General Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:1080px;height:1350px;overflow:hidden;background:radial-gradient(1100px 700px at 85% -10%,rgba(14,165,233,.24),transparent 60%),radial-gradient(800px 600px at -10% 110%,rgba(14,165,233,.10),transparent 60%),var(--bg)}
.in{position:absolute;inset:80px}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.logo{display:flex;align-items:center;gap:14px}
.logo svg{width:52px;height:52px}
.logo b{font-weight:800;font-size:38px;letter-spacing:-.03em;line-height:1}
.logo b i{font-style:normal;color:var(--brand)}
h1,h2{font-weight:700;letter-spacing:-.03em;line-height:1.02;text-wrap:balance}
.hot{color:var(--hot)}
.top{display:flex;justify-content:space-between;align-items:center}
.dots{display:flex;gap:10px}.dots span{width:44px;height:6px;border-radius:3px;background:var(--line)}.dots span.on{background:var(--brand)}
.swipe{position:absolute;bottom:0;right:0;font-size:22px}
.cta{display:inline-flex;background:var(--brand);color:var(--btn);font-weight:700;border-radius:18px;font-size:40px;padding:30px 54px}
`
const logo = `<div class="logo"><svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg><b>Wyber<i>Ai</i></b></div>`
const dots = n => `<div class="dots">${[1, 2, 3].map(i => `<span class="${i === n ? 'on' : ''}"></span>`).join('')}</div>`
const page = body => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="stage"><div class="in">${body}</div></div></body></html>`
const fmt = n => n.toLocaleString('en-US')

const slides = {}

slides['slide-1'] = `
<div class="top">${logo}${dots(1)}</div>
<div class="mono" style="font-size:26px;margin-top:210px">Introducing WyberCode 1.0</div>
<h1 style="font-size:176px;margin-top:34px">A massive<br><span class="hot">upgrade.</span></h1>
<p style="font-size:44px;color:var(--ink2);margin-top:54px;line-height:1.3;max-width:900px">Our new coding engine is live. Faster builds, and 3× the credits on every paid plan.</p>
<div class="mono swipe">Swipe →</div>`

const plans = [['Spark', '₹499', 50, 150], ['Starter', '$29', 150, 450], ['Builder', '$79', 500, 1500], ['Pro', '$199', 1500, 4500]]
slides['slide-2'] = `
<div class="top">${logo}${dots(2)}</div>
<h2 style="font-size:112px;margin-top:80px">3× the credits.<br><span class="hot">Same price.</span></h2>
<div style="margin-top:60px;display:flex;flex-direction:column;gap:20px">
${plans.map(([n, p, o, c]) => `
  <div style="display:grid;grid-template-columns:1fr auto;align-items:center;background:var(--card);border:1.5px solid var(--line);border-radius:24px;padding:30px 40px">
    <div><div style="font-size:42px;font-weight:700">${n}</div><div class="mono" style="font-size:20px;margin-top:6px">${p} / month · unchanged</div></div>
    <div style="display:flex;align-items:baseline;gap:22px"><span style="font-size:34px;color:var(--ink3);text-decoration:line-through">${fmt(o)}</span><span style="font-size:76px;font-weight:700;color:var(--hot);line-height:1">${fmt(c)}</span></div>
  </div>`).join('')}
</div>
<div class="mono" style="position:absolute;bottom:0;left:0;font-size:20px">Credits per month · free plan stays at 30</div>`

slides['slide-3'] = `
<div class="top">${logo}${dots(3)}</div>
<h1 style="font-size:148px;margin-top:200px">Build your<br>next app<br><span class="hot">today.</span></h1>
<p style="font-size:40px;color:var(--ink2);margin-top:50px;line-height:1.3;max-width:860px">Top-up packs are 3× bigger too: 120, 300 and 600 credits at the same prices.</p>
<div style="margin-top:64px"><div class="cta">Start free at wyberai.com</div><div style="font-size:28px;color:var(--ink2);margin-top:22px">30 free credits. No card needed.</div></div>`

for (const [name, body] of Object.entries(slides)) {
  const html = path.join(out, name + '.html'), png = path.join(out, name + '.png')
  fs.writeFileSync(html, page(body))
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1080,1350', '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 })
  console.log(fs.existsSync(png) ? 'ok  ' : 'FAIL', name)
}
