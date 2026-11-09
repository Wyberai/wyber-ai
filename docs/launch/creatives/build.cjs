// Generates the WyberCode 1.0 launch creatives as HTML, then renders PNGs with headless Chrome.
// Run from the repo root:  node docs/launch/creatives/build.cjs
// Look: the Signal design language (dark #05080d, sky #0ea5e9, General Sans + JetBrains Mono). No stock art.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true })

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))

const css = `
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--bg:#05080d;--card:#0d141e;--card2:#111b28;--ink:#e8eef7;--ink2:#9aa8bb;--ink3:#8797ab;--line:rgba(150,190,235,.18);--brand:#0ea5e9;--hot:#38bdf8;--btn:#03111c}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--ink);font-family:'General Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;background:radial-gradient(1100px 700px at 85% -10%,rgba(14,165,233,.22),transparent 60%),radial-gradient(800px 600px at -10% 110%,rgba(14,165,233,.10),transparent 60%),var(--bg)}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:30px;letter-spacing:-.01em}
.brand svg{width:44px;height:44px}
h1,h2{font-weight:700;letter-spacing:-.03em;line-height:1.02;text-wrap:balance}
.hot{color:var(--hot)}
.pill{display:inline-flex;align-items:center;border:1.5px solid var(--line);border-radius:999px;padding:10px 22px;font-size:26px;color:var(--ink2);background:rgba(13,20,30,.7)}
.cta{display:inline-flex;align-items:center;gap:12px;background:var(--brand);color:var(--btn);font-weight:700;border-radius:18px}
`
const mark = `<svg viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#0EA5E9"/><path d="M40 14L22 32L40 50" stroke="#03111c" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 22L56 32L46 42" stroke="#03111c" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity=".4"/></svg>`
const bigMark = `<svg viewBox="0 0 64 64" fill="none" style="position:absolute;right:-120px;bottom:-60px;width:760px;height:760px;opacity:.10"><path d="M40 14L22 32L40 50" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 22L56 32L46 42" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/></svg>`
const head = `<div class="brand">${mark}<span>WyberAi</span></div>`
const foot = `<div class="mono" style="font-size:22px">wyberai.com</div>`
const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}body{width:${w}px;height:${h}px}.stage{width:${w}px;height:${h}px}</style></head><body><div class="stage">${body}</div></body></html>`

const plans = [
  { n: 'Spark', p: '₹499', o: 50, c: 150, w: 0.20 },
  { n: 'Starter', p: '$29', o: 150, c: 450, w: 0.36 },
  { n: 'Builder', p: '$79', o: 500, c: 1500, w: 0.64 },
  { n: 'Pro', p: '$199', o: 1500, c: 4500, w: 1 },
]
const fmt = n => n.toLocaleString('en-US')

const designs = {}

designs['01-cover-1080x1350'] = [1080, 1350, `
${bigMark}
<div style="position:absolute;inset:80px 80px">
  <div style="display:flex;justify-content:space-between;align-items:center">${head}<div class="mono" style="font-size:22px">Now live</div></div>
  <div style="position:absolute;top:300px;left:0;right:0">
    <div class="mono" style="font-size:26px;margin-bottom:34px">The coding engine behind every build</div>
    <h1 style="font-size:156px;white-space:nowrap">WyberCode<br><span class="hot">1.0</span></h1>
    <p style="font-size:40px;color:var(--ink2);margin-top:44px;max-width:900px;line-height:1.3">Describe the app. Watch it get built.<br>Own the code.</p>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end">
    <div class="pill">3× the credits · same price</div>${foot}
  </div>
</div>`]

designs['02-credits-1080x1350'] = [1080, 1350, `
<div style="position:absolute;inset:80px">
  <div style="display:flex;justify-content:space-between;align-items:center">${head}<div class="mono" style="font-size:22px">WyberCode 1.0</div></div>
  <h2 style="font-size:116px;margin-top:70px">3× the credits.<br><span class="hot">Same price.</span></h2>
  <div style="margin-top:64px;display:flex;flex-direction:column;gap:50px">
  ${plans.map(p => `
    <div style="display:grid;grid-template-columns:190px 1fr;align-items:center;gap:20px">
      <div><div style="font-size:38px;font-weight:700">${p.n}</div><div class="mono" style="font-size:20px;margin-top:4px">${p.p} / mo</div></div>
      <div>
        <div style="position:relative;height:64px;background:var(--card);border:1.5px solid var(--line);border-radius:14px">
          <div style="position:absolute;inset:0 auto 0 0;width:${p.w * 100}%;background:linear-gradient(90deg,var(--brand),var(--hot));border-radius:12px;box-shadow:0 0 30px rgba(14,165,233,.35)"></div>
          <div style="position:absolute;inset:0 auto 0 0;width:${p.w * 100 / 3}%;background:rgba(3,17,28,.55);border-radius:12px 0 0 12px;border-right:2px solid var(--bg)"></div>
        </div>
        <div style="display:flex;gap:14px;align-items:baseline;margin-top:8px"><span style="font-size:32px;font-weight:700">${fmt(p.c)}</span><span style="font-size:24px;color:var(--ink3);text-decoration:line-through">${fmt(p.o)}</span><span class="mono" style="font-size:18px">credits / month</span></div>
      </div>
    </div>`).join('')}
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between"><div class="mono" style="font-size:20px">Free plan stays at 30 credits</div>${foot}</div>
</div>`]

designs['03-topups-1080x1350'] = [1080, 1350, `
<div style="position:absolute;inset:80px">
  <div style="display:flex;justify-content:space-between;align-items:center">${head}<div class="mono" style="font-size:22px">WyberCode 1.0</div></div>
  <h2 style="font-size:116px;margin-top:70px">Top-ups got<br><span class="hot">bigger too.</span></h2>
  <div style="margin-top:70px;display:flex;flex-direction:column;gap:26px">
  ${[['Boost', '$19', '120', '40'], ['Power', '$49', '300', '100'], ['Studio', '$99', '600', '200']].map(([n, pr, c, o]) => `
    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1.5px solid var(--line);border-radius:26px;padding:38px 46px">
      <div><div style="font-size:44px;font-weight:700">${n}</div><div class="mono" style="font-size:22px;margin-top:6px">${pr} one-time · never expires</div></div>
      <div style="text-align:right"><div style="font-size:84px;font-weight:700;color:var(--hot);line-height:1">${c}</div><div style="font-size:26px;color:var(--ink3);margin-top:6px">credits <span style="text-decoration:line-through">(${o})</span></div></div>
    </div>`).join('')}
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:20px">Same prices as before</div>${foot}</div>
</div>`]

designs['04-cta-1080x1350'] = [1080, 1350, `
${bigMark}
<div style="position:absolute;inset:80px">
  <div style="display:flex;justify-content:space-between;align-items:center">${head}<div class="mono" style="font-size:22px">WyberCode 1.0</div></div>
  <h1 style="font-size:150px;margin-top:230px">Describe it.<br>Watch it.<br><span class="hot">Own it.</span></h1>
  <div style="margin-top:80px;display:flex;flex-direction:column;gap:26px;align-items:flex-start">
    <div class="cta" style="font-size:38px;padding:30px 52px">Start free at wyberai.com</div>
    <div style="font-size:28px;color:var(--ink2)">30 free credits. No card.</div>
  </div>
</div>`]

designs['05-landscape-1200x627'] = [1200, 627, `
${bigMark.replace('width:760px;height:760px', 'width:520px;height:520px').replace('right:-120px;bottom:-60px', 'right:-90px;bottom:-110px')}
<div style="position:absolute;inset:52px 60px">
  ${head.replace('font-size:30px', '')}
  <h1 style="font-size:88px;margin-top:70px;max-width:860px">WyberCode 1.0<br><span class="hot">is live.</span></h1>
  <p style="font-size:32px;color:var(--ink2);margin-top:26px">3× the credits on every paid plan. Same price.</p>
  <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="display:flex;gap:12px">${plans.map(p => `<div class="pill" style="font-size:20px;padding:8px 16px">${p.n} ${fmt(p.c)}</div>`).join('')}</div>${foot}
  </div>
</div>`]

designs['06-story-1080x1920'] = [1080, 1920, `
${bigMark.replace('width:760px;height:760px', 'width:900px;height:900px').replace('bottom:-60px', 'bottom:120px')}
<div style="position:absolute;inset:140px 80px">
  <div style="display:flex;justify-content:space-between;align-items:center">${head}<div class="mono" style="font-size:22px">Now live</div></div>
  <div class="mono" style="font-size:30px;margin-top:230px">WyberCode 1.0</div>
  <div style="font-size:430px;font-weight:700;letter-spacing:-.05em;line-height:.95;color:var(--hot);margin-top:10px">3×</div>
  <h2 style="font-size:100px;margin-top:20px">the credits.<br>Same price.</h2>
  <div style="margin-top:70px;display:flex;flex-wrap:wrap;gap:16px">${plans.map(p => `<div class="pill" style="font-size:30px">${p.n} · ${fmt(p.c)}</div>`).join('')}</div>
  <div style="position:absolute;bottom:200px;left:0;right:0"><div class="cta" style="font-size:40px;padding:32px 56px">Start free at wyberai.com</div></div>
</div>`]

for (const [name, [w, h, body]] of Object.entries(designs)) {
  const html = path.join(out, name + '.html'), png = path.join(out, name + '.png')
  fs.writeFileSync(html, page(w, h, body))
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 })
  console.log(fs.existsSync(png) ? 'ok  ' : 'FAIL', name)
}
