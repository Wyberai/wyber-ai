// Instagram story (1080x1920) for the WyberCode 1.0 launch. Run from repo root: node docs/launch/creatives/story.cjs
// Safe zone: Instagram covers ~250px at the top and ~340px at the bottom, so content sits between y=260 and y=1580.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const out = path.join(__dirname, 'story'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true })
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))
const css = `
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--bg:#05080d;--card:#0d141e;--ink:#e8eef7;--ink2:#9aa8bb;--ink3:#8797ab;--line:rgba(150,190,235,.2);--brand:#0ea5e9;--hot:#38bdf8;--btn:#03111c}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;background:var(--bg);color:var(--ink);font-family:'General Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(1200px 900px at 90% -5%,rgba(14,165,233,.28),transparent 60%),radial-gradient(900px 700px at -10% 105%,rgba(14,165,233,.12),transparent 60%),var(--bg)}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.logo{display:flex;align-items:center;gap:16px}.logo svg{width:60px;height:60px}.logo b{font-weight:800;font-size:44px;letter-spacing:-.03em;line-height:1}.logo b i{font-style:normal;color:var(--brand)}
h2{font-weight:700;letter-spacing:-.03em;line-height:1.02}.hot{color:var(--hot)}
.pill{display:inline-flex;border:1.5px solid var(--line);border-radius:999px;padding:12px 26px;font-size:30px;color:var(--ink2);background:rgba(13,20,30,.7)}
.cta{display:inline-flex;background:var(--brand);color:var(--btn);font-weight:700;border-radius:20px;font-size:40px;padding:30px 54px}
`
const mark = `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const body = `
<div style="position:absolute;left:80px;right:80px;top:280px">
  <div class="logo">${mark}<b>Wyber<i>Ai</i></b></div>
  <div class="mono" style="font-size:30px;margin-top:130px">WyberCode 1.0 is live</div>
  <div style="font-size:440px;font-weight:700;letter-spacing:-.05em;line-height:.95;color:var(--hot);margin-top:6px">3×</div>
  <h2 style="font-size:104px;margin-top:14px">the credits.<br>Same price.</h2>
  <div style="margin-top:64px;display:flex;flex-wrap:wrap;gap:14px">
    <div class="pill">Spark · 150</div><div class="pill">Starter · 450</div><div class="pill">Builder · 1,500</div><div class="pill">Pro · 4,500</div>
  </div>
  <div style="margin-top:70px"><div class="cta">Start free · link in bio</div></div>
</div>`
const html = path.join(out, 'story.html'), png = path.join(out, 'story-1080x1920.png')
fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="stage">${body}</div></body></html>`)
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1080,1920', '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 })
console.log(fs.existsSync(png) ? 'ok  story' : 'FAIL')
