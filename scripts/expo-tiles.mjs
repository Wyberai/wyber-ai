// Xpro service tiles, 1000x1000 (1:1), matching the booth backdrop. Run: node scripts/expo-tiles.mjs
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'booth-artwork', '2-UPLOAD-TO-XPRO', 'service-tiles')
fs.mkdirSync(OUT, { recursive: true })
const SKY = '#0ea5e9'
const mark = `<svg width="84" height="84" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="${SKY}"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const TILES = [
  ['tile-xray-vision', 'X-ray vision', 'We probe your live database like an attacker, right after you publish.'],
  ['tile-key-lock', 'Key lock', 'An exposed secret key stops a publish and an export.'],
  ['tile-security-armour', 'Security armour', 'A full security checklist from the editor, any time.'],
  ['tile-be-seen', 'Be seen', 'Readable by Google and by AI assistants.'],
  ['tile-anti-slop-radar', 'Anti-slop radar', 'Flags the made-by-AI look and quotes what it found.'],
  ['tile-two-forms', 'Two forms', 'A website and a mobile app from one prompt.'],
]
const html = (t, d) => `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;width:1000px;height:1000px;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;overflow:hidden}
.glow{position:absolute;right:-260px;top:-260px;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,rgba(14,165,233,.26),transparent)}
.mk{position:absolute;left:80px;top:80px}
.t{position:absolute;left:80px;top:370px;font-weight:900;font-size:var(--fs);letter-spacing:-.045em;line-height:1}
.d{position:absolute;left:80px;top:560px;width:800px;font-size:50px;line-height:1.25;font-weight:500;color:#9aa4b5}
.bar{position:absolute;left:80px;top:320px;width:120px;height:10px;border-radius:5px;background:${SKY}}
.f{position:absolute;left:80px;bottom:70px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:28px;letter-spacing:.14em;color:#6b7488}
</style></head><body><div class="glow"></div><div class="mk">${mark}</div><div class="bar"></div>
<div class="t" style="--fs:${t.length <= 8 ? 150 : t.length <= 12 ? 120 : 96}px">${t}</div><div class="d">${d}</div><div class="f">WYBERAI &nbsp;·&nbsp; VIBE CODING + SUPERPOWERS</div></body></html>`

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] })
for (const [file, t, d] of TILES) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 })
  await pg.setContent(html(t, d), { waitUntil: 'networkidle2', timeout: 90000 })
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: path.join(OUT, file + '.png') })
  await pg.close()
  console.log('wrote', file)
}
await browser.close()
