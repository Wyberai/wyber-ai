// Render an animated reel HTML → MP4 locally. No third-party service needed.
// Frame-accurate: calls window.__seek(t) per frame, screenshots, then ffmpeg assembles.
// Usage: node scripts/reel-video.mjs "<input.html>" "<output.mp4>" [fps]
import puppeteer from 'puppeteer-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , inArg, outArg, fpsArg] = process.argv
if (!inArg || !outArg) { console.error('Usage: node scripts/reel-video.mjs "<input.html>" "<output.mp4>" [fps]'); process.exit(1) }

const inPath = path.resolve(inArg)
const outPath = path.resolve(outArg)
const fps = parseInt(fpsArg || '30', 10)
const fileUrl = 'file:///' + inPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')

// temp frame dir in the OS temp area
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wyber-reel-'))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1'],
})
const page = await browser.newPage()
// Tell the HTML we're rendering so its real-time self-play loop stays OFF.
await page.evaluateOnNewDocument(() => { window.__RENDER = true })
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 90000 })
try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
const interOk = await page.evaluate(() => document.fonts.check('900 60px Inter')).catch(() => false)

const duration = await page.evaluate(() => window.__DURATION || 8)
const total = Math.round(duration * fps)
console.log(`rendering ${total} frames @ ${fps}fps (${duration}s)`, interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')

for (let i = 0; i < total; i++) {
  const t = i / fps
  await page.evaluate((tt) => window.__seek(tt), t)
  await page.screenshot({ path: path.join(tmp, `f_${String(i).padStart(4, '0')}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } })
  if (i % 30 === 0) process.stdout.write(`  ${i}/${total}\r`)
}
await browser.close()

fs.mkdirSync(path.dirname(outPath), { recursive: true })
// yuv420p + faststart = plays everywhere (IG, LinkedIn, WhatsApp, QuickTime).
execFileSync('ffmpeg', [
  '-y', '-framerate', String(fps), '-i', path.join(tmp, 'f_%04d.png'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps), outPath,
], { stdio: 'inherit' })

fs.rmSync(tmp, { recursive: true, force: true })
const kb = Math.round(fs.statSync(outPath).size / 1024)
console.log(`\nDONE → ${outPath} (${kb} KB)`)
