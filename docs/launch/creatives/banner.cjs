// LinkedIn banners for the WyberCode 1.0 launch. Run from repo root: node docs/launch/creatives/banner.cjs
// Personal profile cover 1584x396 (profile photo covers the bottom-left, so content starts at x=430); company page cover 1128x191.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const out = path.join(__dirname, 'banners'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true })
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))

const css = (w, h) => `
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
:root{--bg:#05080d;--ink:#e8eef7;--ink2:#9aa8bb;--ink3:#8797ab;--line:rgba(150,190,235,.22);--brand:#0ea5e9;--hot:#38bdf8}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;background:var(--bg);color:var(--ink);font-family:'General Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:radial-gradient(${w * 0.7}px ${h * 1.6}px at 90% -20%,rgba(14,165,233,.32),transparent 60%),radial-gradient(${w * 0.4}px ${h}px at 0% 120%,rgba(14,165,233,.12),transparent 60%),var(--bg)}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.logo{display:flex;align-items:center;gap:12px}.logo svg{width:var(--m);height:var(--m)}
.logo b{font-weight:800;font-size:var(--w);letter-spacing:-.03em;line-height:1}.logo b i{font-style:normal;color:var(--brand)}
h1{font-weight:700;letter-spacing:-.03em;line-height:1.04}.hot{color:var(--hot)}
.pill{display:inline-flex;border:1.5px solid var(--line);border-radius:999px;color:var(--ink2);background:rgba(13,20,30,.7)}
`
const mark = `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const logo = (m, w) => `<div class="logo" style="--m:${m}px;--w:${w}px">${mark}<b>Wyber<i>Ai</i></b></div>`
const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css(w, h)}</style></head><body><div class="stage">${body}</div></body></html>`

const banners = {
  'linkedin-profile-1584x396': [1584, 396, `
    <div style="position:absolute;left:430px;top:52px">${logo(44, 34)}</div>
    <h1 style="position:absolute;left:430px;top:122px;font-size:84px;white-space:nowrap">WyberCode 1.0 <span class="hot">is live.</span></h1>
    <div style="position:absolute;left:430px;top:238px;font-size:34px;color:var(--ink2)">3× the credits on every paid plan. Same price.</div>
    <div class="pill" style="position:absolute;left:430px;top:304px;font-size:24px;padding:10px 24px">Describe it. Watch it. Own it.</div>
    <div class="mono" style="position:absolute;right:70px;top:62px;font-size:26px">wyberai.com</div>`],
  'linkedin-company-1128x191': [1128, 191, `
    <div style="position:absolute;left:56px;top:34px">${logo(34, 27)}</div>
    <h1 style="position:absolute;left:56px;top:84px;font-size:52px;white-space:nowrap">WyberCode 1.0 <span class="hot">is live.</span></h1>
    <div style="position:absolute;left:56px;top:148px;font-size:22px;color:var(--ink2)">3× the credits on every paid plan. Same price.</div>
    <div class="mono" style="position:absolute;right:56px;top:42px;font-size:20px">wyberai.com</div>
    <div class="pill" style="position:absolute;right:56px;bottom:30px;font-size:18px;padding:8px 18px">Describe it. Watch it. Own it.</div>`],
}
for (const [name, [w, h, body]] of Object.entries(banners)) {
  const html = path.join(out, name + '.html'), png = path.join(out, name + '.png')
  fs.writeFileSync(html, page(w, h, body))
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 })
  console.log(fs.existsSync(png) ? 'ok  ' : 'FAIL', name)
}
