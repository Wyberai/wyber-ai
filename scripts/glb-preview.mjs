// Quick GLB viewer — loads a model, orbits it, screenshots a few angles.
// Usage: node scripts/glb-preview.mjs <name-in-public-space> <outDir>
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , name, outDirArg] = process.argv
if (!name) { console.error('Usage: node scripts/glb-preview.mjs <name> [outDir]'); process.exit(1) }
const outDir = path.resolve(outDirArg || path.join(process.cwd(), 'scratch-glb-preview'))
fs.mkdirSync(outDir, { recursive: true })

// Serve the project root over plain HTTP so ES module imports (which file:// blocks via CORS) work.
const ROOT = process.cwd()
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
    res.end(data)
  })
})
const PORT = 8971
await new Promise((resolve) => server.listen(PORT, resolve))
const base = `http://localhost:${PORT}`

const glbUrl = `${base}/public/space/${name}.glb`
const threeUrl = `${base}/node_modules/three/build/three.module.js`
const gltfLoaderUrl = `${base}/node_modules/three/examples/jsm/loaders/GLTFLoader.js`
const fileUrl = glbUrl

const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}html,body{width:1080px;height:1080px;background:#09090b;overflow:hidden}</style></head>
<body>
<script type="importmap">{"imports":{"three":"${threeUrl}"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from '${gltfLoaderUrl}';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09090b);
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1080, 1080);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xbbddff, 0x1a1a20, 1.2);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x0EA5E9, 1.8);
rim.position.set(-4, 2, -3);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-2, 1, 4);
scene.add(fill);

let model = null;
window.__ready = false;
new GLTFLoader().load('${fileUrl}', (gltf) => {
  model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.2 / maxDim;
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  scene.add(model);
  window.__ready = true;
}, undefined, (err) => { console.error('load error', err); window.__ready = 'error'; });

window.__setAngle = function(deg, elev) {
  const r = 3.4;
  const rad = deg * Math.PI / 180;
  const e = (elev || 0) * Math.PI / 180;
  camera.position.set(r * Math.cos(rad) * Math.cos(e), r * Math.sin(e) + 0.3, r * Math.sin(rad) * Math.cos(e));
  camera.lookAt(0, 0.1, 0);
  renderer.render(scene, camera);
};
window.__setAngle(0, 5);
</script>
</body></html>`

const tmpHtml = path.join(outDir, '_viewer.html')
fs.writeFileSync(tmpHtml, html)
const viewerUrl = `${base}/${path.relative(ROOT, tmpHtml).replace(/\\/g, '/')}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
page.on('console', (m) => console.log('[page]', m.text()))
await page.setViewport({ width: 1080, height: 1080 })
await page.goto(viewerUrl, { waitUntil: 'load' })

// wait for model load
const start = Date.now()
while (Date.now() - start < 30000) {
  const ready = await page.evaluate(() => window.__ready)
  if (ready === true || ready === 'error') break
  await new Promise(r => setTimeout(r, 300))
}
const status = await page.evaluate(() => window.__ready)
if (status !== true) { console.error('Model failed to load:', status); await browser.close(); process.exit(1) }

const angles = [0, 45, 90, 180]
for (const a of angles) {
  await page.evaluate((deg) => window.__setAngle(deg, 8), a)
  await new Promise(r => setTimeout(r, 150))
  await page.screenshot({ path: path.join(outDir, `${name}_${a}.png`) })
  console.log('wrote', `${name}_${a}.png`)
}
await browser.close()
server.close()
