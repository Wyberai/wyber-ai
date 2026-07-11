// Render a WebGL (Three.js) scene HTML → MP4. Same frame-accurate approach as
// reel-video.mjs, but served over HTTP (not file://) since ES module imports
// are CORS-blocked on file://.
// Usage: node scripts/movie-video.mjs "<scene.html>" "<output.mp4>" [fps]
import puppeteer from 'puppeteer-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , inArg, outArg, fpsArg] = process.argv
if (!inArg || !outArg) { console.error('Usage: node scripts/movie-video.mjs "<scene.html>" "<output.mp4>" [fps]'); process.exit(1) }
const outPath = path.resolve(outArg)
const fps = parseInt(fpsArg || '30', 10)

const ROOT = process.cwd()
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
    res.end(data)
  })
})
const PORT = 8973
await new Promise((resolve) => server.listen(PORT, resolve))
const sceneUrl = `http://localhost:${PORT}/${path.relative(ROOT, path.resolve(inArg)).replace(/\\/g, '/')}`

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wyber-movie-'))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', '--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.evaluateOnNewDocument(() => { window.__RENDER = true })
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto(sceneUrl, { waitUntil: 'networkidle2', timeout: 90000 })
try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 8000))]) } catch {}
await new Promise(r => setTimeout(r, 4000)) // let async GLTF/texture loads land

const duration = await page.evaluate(() => window.__DURATION || 8)
const total = Math.round(duration * fps)
console.log(`rendering ${total} frames @ ${fps}fps (${duration}s)`)

for (let i = 0; i < total; i++) {
  const t = i / fps
  await page.evaluate((tt) => window.__seek(tt), t)
  const framePath = path.join(tmp, `f_${String(i).padStart(4, '0')}.png`)
  await page.screenshot({ path: framePath })
  if (i % 30 === 0) process.stdout.write(`  ${i}/${total}`)
}
console.log('')
await browser.close()
server.close()

execFileSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(tmp, 'f_%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', outPath], { stdio: 'inherit' })
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\nDONE -> ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`)
