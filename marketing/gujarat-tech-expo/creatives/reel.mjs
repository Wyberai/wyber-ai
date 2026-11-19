// Reel: 100 features -> 5 -> five things we build -> typed prompt -> built -> booth card. 1080x1920, 30fps, deterministic (seek by time).
// Usage: node marketing/gujarat-tech-expo/creatives/reel.mjs [still:t1,t2,...]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT = path.join(ROOT, 'out', 'v2', 'reel')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')
const ICON = b64(path.join(ROOT, 'wyberai-icon-1024.png'))
const LOGO = b64(path.join(ROOT, 'tech-expo-logo.png'))
const DUR = 14
const FPS = 30

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#05060a;--raised:#0a0c14;--accent:#0ea5e9;--hot:#38bdf8;--text:#e6edf6;--dim:#8b94a7;--faint:#5b6477;--border:rgba(255,255,255,.14)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:var(--bg);font-family:'Inter',sans-serif;color:var(--text)}
#st{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse 80% 40% at 90% -5%,rgba(14,165,233,.24),transparent 62%),radial-gradient(ellipse 70% 35% at 0% 105%,rgba(14,165,233,.12),transparent 60%),var(--bg)}
.L{position:absolute;left:80px;right:80px;will-change:opacity,transform}
.lockup{position:absolute;left:80px;top:170px;display:flex;align-items:center;gap:18px;font-weight:900;font-size:54px;letter-spacing:-.04em}
.lockup img{width:76px;height:76px;border-radius:18px}.lockup b{color:var(--accent)}
.tag{position:absolute;right:80px;top:196px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:23px;letter-spacing:.2em;color:var(--hot)}
h1,h2{font-weight:900;letter-spacing:-.045em;line-height:.97}h1{font-size:112px}h2{font-size:96px}
em{font-style:normal;color:var(--hot)}
.mono{font-family:'JetBrains Mono',monospace}
.sub{font-weight:500;font-size:40px;line-height:1.3;letter-spacing:-.02em;color:var(--dim)}
.grid{display:grid;grid-template-columns:repeat(20,1fr);gap:8px}
.c{aspect-ratio:1;border-radius:7px;background:#10131c;border:1px solid rgba(255,255,255,.07);opacity:0}
.c.on{background:var(--accent);border-color:var(--hot)}
.chip{display:flex;align-items:center;gap:28px;border:1.5px solid var(--border);background:var(--raised);border-radius:28px;padding:30px 40px;font-weight:900;font-size:64px;letter-spacing:-.04em;margin-bottom:20px;opacity:0}
.chip .k{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:26px;letter-spacing:.14em;color:var(--hot)}
.chip.hot{border-color:rgba(56,189,248,.6);background:rgba(14,165,233,.1)}
.pbox{border:1.5px solid rgba(56,189,248,.5);background:var(--raised);border-radius:30px;padding:44px;box-shadow:0 40px 100px -30px rgba(14,165,233,.5)}
.pbox .lab{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;letter-spacing:.18em;color:var(--hot);margin-bottom:22px}
.pbox .txt{font-weight:800;font-size:54px;line-height:1.2;letter-spacing:-.03em;min-height:260px}
.caret{display:inline-block;width:6px;height:56px;background:var(--hot);vertical-align:-8px;margin-left:4px}
.bar{height:16px;border-radius:8px;background:#10131c;overflow:hidden;margin-top:30px}.bar i{display:block;height:100%;width:0;background:var(--accent);box-shadow:0 0 24px rgba(14,165,233,.8)}
.done{display:flex;align-items:center;gap:18px;margin-top:26px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;letter-spacing:.1em;color:#3ddc97}
.logocard{background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;overflow:hidden;height:360px}.logocard img{height:92%}
.booth{background:var(--accent);border-radius:36px;color:#fff;padding:36px 44px;display:flex;flex-direction:column;justify-content:space-between;height:360px;box-shadow:0 30px 80px -20px rgba(14,165,233,.6)}
.booth small{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;letter-spacing:.2em;color:#032a40}.booth b{font-weight:900;font-size:170px;letter-spacing:-.06em;line-height:.85}
.pill{display:inline-block;border:1.5px solid rgba(56,189,248,.4);background:rgba(14,165,233,.08);border-radius:22px;padding:22px 36px;font-weight:800;font-size:44px;letter-spacing:-.03em}
.btn{display:inline-block;background:var(--accent);color:#031420;font-weight:900;font-size:52px;letter-spacing:-.03em;border-radius:28px;padding:34px 60px;box-shadow:0 24px 60px -18px rgba(14,165,233,.8)}
</style></head><body><div id="st">
<div class="lockup"><img src="${ICON}" alt=""><span>Wyber<b>Ai</b></span></div><div class="tag">TECH EXPO GUJARAT</div>

<div id="A" class="L" style="top:560px">
  <div class="mono" id="cnt" style="font-weight:700;font-size:210px;letter-spacing:-.05em;line-height:1">0</div>
  <div class="mono" id="cl" style="font-weight:700;font-size:30px;letter-spacing:.2em;color:var(--hot);margin:6px 0 60px">FEATURES YOU PAY FOR</div>
  <div class="grid" id="g"></div>
  <h1 id="h1" style="margin-top:70px;opacity:0">Most software has 100 features.<br><em>You use 5.</em></h1>
</div>

<div id="B" class="L" style="top:480px;opacity:0">
  <h2 style="margin-bottom:60px">Tell us what<br>you need.</h2>
  <div id="chips"></div>
</div>

<div id="C" class="L" style="top:480px;opacity:0">
  <h2 style="margin-bottom:56px">We build it<br><em>live.</em></h2>
  <div class="pbox"><div class="lab">YOU SAY IT</div><div class="txt"><span id="typed"></span><span class="caret" id="caret"></span></div>
    <div class="bar"><i id="fill"></i></div>
    <div class="done" id="done" style="opacity:0">✓ BUILT. REAL CODE YOU KEEP</div></div>
</div>

<div id="D" class="L" style="top:400px;opacity:0">
  <div class="mono" style="font-weight:700;font-size:26px;letter-spacing:.2em;color:var(--hot);margin-bottom:28px">SEE US AT</div>
  <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:24px"><div class="logocard"><img src="${LOGO}" alt=""></div><div class="booth"><small>BOOTH</small><b>S23</b></div></div>
  <h2 style="margin:70px 0 50px">Bring what<br>you need.<br><em>We’ll build it live.</em></h2>
  <div class="pill">27–28–29 Nov, 2026</div>
  <p class="sub" style="margin:26px 0 70px;color:var(--text);font-weight:800">GUCEC (GMDC Ground), Ahmedabad</p>
  <span class="btn">Book 15 minutes</span>
  <div class="mono" style="margin-top:34px;font-weight:700;font-size:34px;letter-spacing:.04em">wyberai.com<em>/expo</em></div>
</div>
</div>
<script>
const LIT=[7,23,41,58,86];
const g=document.getElementById('g');
const order=[];for(let i=0;i<100;i++){order.push((i*37+11)%100)}
for(let i=0;i<100;i++){const d=document.createElement('div');d.className='c'+(LIT.includes(i)?' on':'');g.appendChild(d)}
const cells=[...g.children];
const ITEMS=['Web app','Website','Mobile app','SaaS','Your own version of a tool'];
const chips=document.getElementById('chips');
ITEMS.forEach((t,i)=>{const d=document.createElement('div');d.className='chip'+(i==4?' hot':'');d.innerHTML='<span class="k">0'+(i+1)+'</span>'+t;chips.appendChild(d)});
const chipEls=[...chips.children];
const PROMPT='Replace my billing software. I only need invoices and GST.';
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>cl((t-a)/(b-a));
const ease=x=>1-Math.pow(1-x,3);
const $=id=>document.getElementById(id);
window.__seek=function(t){
  // A: counter + grid
  const showA=1-seg(t,4.1,4.7);
  $('A').style.opacity=showA;$('A').style.transform='translateY('+(-40*seg(t,4.1,4.7))+'px)';
  let count=0;
  cells.forEach((c,i)=>{
    const appear=0.15+(order[i]/100)*1.7;
    const a=ease(seg(t,appear,appear+0.25));
    const lit=LIT.includes(i);
    const fade=ease(seg(t,2.5,3.3));
    if(a>0.5)count++;
    if(lit){c.style.opacity=a;c.style.transform='scale('+(.6+.4*a+0.14*fade)+')';c.style.boxShadow='0 0 '+(34*fade)+'px rgba(14,165,233,'+(.8*fade)+')'}
    else{c.style.opacity=a*(1-.78*fade);c.style.transform='scale('+((.6+.4*a)*(1-.12*fade))+')'}
  });
  const f=ease(seg(t,2.5,3.4));
  $('cnt').textContent=Math.round(t<2.5?count:100-(95*f));
  $('cl').textContent=t<2.9?'FEATURES YOU PAY FOR':'FEATURES YOU ACTUALLY USE';
  $('cnt').style.color=t<2.9?'#e6edf6':'#38bdf8';
  $('h1').style.opacity=ease(seg(t,3.2,3.8));$('h1').style.transform='translateY('+(30*(1-ease(seg(t,3.2,3.8))))+'px)';
  // B: five things
  const inB=seg(t,4.5,4.9)*(1-seg(t,8.5,9.0));
  $('B').style.opacity=inB;
  chipEls.forEach((c,i)=>{const s=ease(seg(t,4.9+i*.45,5.3+i*.45));c.style.opacity=s;c.style.transform='translateX('+(60*(1-s))+'px)'});
  // C: typed prompt + build
  const inC=seg(t,8.9,9.3)*(1-seg(t,12.0,12.5));
  $('C').style.opacity=inC;
  const nch=Math.floor(PROMPT.length*seg(t,9.4,10.9));
  $('typed').textContent=PROMPT.slice(0,nch);
  $('caret').style.opacity=(Math.floor(t*2)%2==0||nch<PROMPT.length)?1:0;
  $('fill').style.width=(100*ease(seg(t,11.0,11.9)))+'%';
  $('done').style.opacity=ease(seg(t,11.9,12.2));
  // D: end card
  const inD=seg(t,12.3,12.8);
  $('D').style.opacity=inD;$('D').style.transform='translateY('+(30*(1-inD))+'px)';
};
window.__seek(0);
</script></body></html>`

fs.mkdirSync(OUT, { recursive: true })
const htmlPath = path.join(OUT, 'reel.html')
fs.writeFileSync(htmlPath, html)
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 60000 })
await page.evaluate(() => document.fonts.ready)

const arg = process.argv[2]
if (arg && arg.startsWith('still:')) {
  for (const t of arg.slice(6).split(',').map(Number)) {
    await page.evaluate(tt => window.__seek(tt), t)
    await page.screenshot({ path: path.join(OUT, `still_${t}.png`) })
    console.log('still', t)
  }
} else {
  const frames = path.join(OUT, 'frames')
  fs.rmSync(frames, { recursive: true, force: true })
  fs.mkdirSync(frames)
  const n = DUR * FPS
  for (let i = 0; i < n; i++) {
    await page.evaluate(tt => window.__seek(tt), i / FPS)
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 94 })
    if (i % 60 === 0) console.log('frame', i, '/', n)
  }
  const mp4 = path.join(OUT, 'wyberai-expo-reel-9x16.mp4')
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
  console.log('wrote', mp4)
}
await browser.close()
