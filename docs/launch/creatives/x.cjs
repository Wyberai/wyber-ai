// X header (1500x500) and post image (1600x900). Run from repo root: node docs/launch/creatives/x.cjs
// X's header is cropped on phones and the profile photo covers the bottom-left, so the text sits right of centre in the middle band.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const out = path.join(__dirname, 'x'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true })
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))
const css = (w, h) => `
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--bg:#05080d;--card:#0d141e;--ink:#e8eef7;--ink2:#9aa8bb;--ink3:#8797ab;--line:rgba(150,190,235,.22);--brand:#0ea5e9;--hot:#38bdf8}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;background:var(--bg);color:var(--ink);font-family:'General Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:radial-gradient(${w * 0.6}px ${h * 1.3}px at 90% -15%,rgba(14,165,233,.30),transparent 60%),radial-gradient(${w * 0.4}px ${h}px at 0% 120%,rgba(14,165,233,.12),transparent 60%),var(--bg)}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.logo{display:flex;align-items:center;gap:14px}.logo svg{width:var(--m);height:var(--m)}.logo b{font-weight:800;font-size:var(--w);letter-spacing:-.03em;line-height:1}.logo b i{font-style:normal;color:var(--brand)}
h1,h2{font-weight:700;letter-spacing:-.03em;line-height:1.04}.hot{color:var(--hot)}
.pill{display:inline-flex;border:1.5px solid var(--line);border-radius:999px;color:var(--ink2);background:rgba(13,20,30,.7)}
`
const mark = `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const logo = (m, w) => `<div class="logo" style="--m:${m}px;--w:${w}px">${mark}<b>Wyber<i>Ai</i></b></div>`
const plans = [['Spark', '₹499', 50, 150], ['Starter', '$29', 150, 450], ['Builder', '$79', 500, 1500], ['Pro', '$199', 1500, 4500]]
const fmt = n => n.toLocaleString('en-US')
const items = {
  'x-header-1500x500': [1500, 500, `
    <div style="position:absolute;left:430px;top:110px">${logo(52, 40)}</div>
    <h1 style="position:absolute;left:430px;top:190px;font-size:96px;white-space:nowrap">WyberCode 1.0 <span class="hot">is live.</span></h1>
    <div style="position:absolute;left:430px;top:320px;font-size:38px;color:var(--ink2)">3× the credits on every paid plan. Same price.</div>
    <div class="mono" style="position:absolute;right:60px;top:60px;font-size:24px">wyberai.com</div>`],
  'x-post-image-1600x900': [1600, 900, `
    <div style="position:absolute;left:90px;top:70px">${logo(60, 46)}</div>
    <div class="mono" style="position:absolute;right:90px;top:84px;font-size:26px">WyberCode 1.0 is live</div>
    <h1 style="position:absolute;left:90px;top:190px;font-size:128px">3× the credits.<br><span class="hot">Same price.</span></h1>
    <div style="position:absolute;left:90px;right:90px;top:520px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
    ${plans.map(([n, p, o, c]) => `<div style="background:var(--card);border:1.5px solid var(--line);border-radius:24px;padding:28px 30px">
      <div style="font-size:34px;font-weight:700">${n}</div><div class="mono" style="font-size:18px;margin-top:4px">${p} / mo</div>
      <div style="font-size:70px;font-weight:700;color:var(--hot);line-height:1;margin-top:22px">${fmt(c)}</div>
      <div style="font-size:24px;color:var(--ink3);margin-top:8px">was <span style="text-decoration:line-through">${fmt(o)}</span></div></div>`).join('')}
    </div>
    <div class="mono" style="position:absolute;left:90px;bottom:60px;font-size:20px">Credits per month · free plan stays at 30 · wyberai.com</div>`],
}
for (const [name, [w, h, body]] of Object.entries(items)) {
  const html = path.join(out, name + '.html'), png = path.join(out, name + '.png')
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css(w, h)}</style></head><body><div class="stage">${body}</div></body></html>`)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 })
  console.log(fs.existsSync(png) ? 'ok  ' : 'FAIL', name)
}
