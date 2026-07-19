// Preview stills of a WebGL (Three.js) scene HTML at given timestamps.
// Needs HTTP (not file://) because ES module imports are CORS-blocked on file://.
// Usage: node scripts/movie-frames.mjs "<scene.html relative to repo root>" "<outDir>" "t1,t2,..."
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , sceneArg, outDirArg, timesArg] = process.argv
if (!sceneArg) { console.error('Usage: node scripts/movie-frames.mjs "<scene.html>" "<outDir>" "t1,t2,..."'); process.exit(1) }
const outDir = path.resolve(outDirArg || path.join(process.cwd(), 'scratch-movie', 'preview'))
fs.mkdirSync(outDir, { recursive: true })
const times = (timesArg || '0').split(',').map(s => parseFloat(s.trim()))

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
const PORT = 8972
await new Promise((resolve) => server.listen(PORT, resolve))
const sceneUrl = `http://localhost:${PORT}/${path.relative(ROOT, path.resolve(sceneArg)).replace(/\\/g, '/')}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', '--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
page.on('console', (m) => console.log('[page]', m.text()))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.evaluateOnNewDocument(() => { window.__RENDER = true })
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto(sceneUrl, { waitUntil: 'networkidle2', timeout: 90000 })
try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 8000))]) } catch {}
// give async GLTF/texture loads time to land before the first seek
await new Promise(r => setTimeout(r, 4000))

for (const t of times) {
  await page.evaluate((tt) => window.__seek(tt), t)
  await new Promise(r => setTimeout(r, 150))
  const p = path.join(outDir, `t_${String(t).replace('.', '_')}.png`)
  await page.screenshot({ path: p })
  console.log('✓', p)
}
await browser.close()
server.close()
