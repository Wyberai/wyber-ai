// LIVE integration check: runs PreviewPanel's exact transform pipeline against
// the REAL preview-builder and asserts the bridge + loc tags survive its
// `vite build`. Network-bound, so it's opt-in:
//   LIVE_BUILDER=1 npx vitest run src/lib/wyber-preview/bridge.live.test.ts
// (verified PASSING against the live builder on 2026-07-10)
import { describe, it, expect } from 'vitest'
import { sanitizeFiles } from '../sanitize-files'
import { injectWyberLoc, injectPreviewBridge } from './bridge'

const live = !!process.env.LIVE_BUILDER

const APP = `export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold">Bridge live test</h1>
      <p className="text-muted-foreground">If you can select me, the bridge works.</p>
      <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Click me</button>
    </div>
  )
}`

describe.skipIf(!live)('bridge survives the real remote build', () => {
  it('served preview carries the bridge script and data-wyber-loc attributes', async () => {
    const files = injectPreviewBridge(sanitizeFiles(injectWyberLoc({
      'src/App.tsx': { content: APP, language: 'typescript' },
    })))

    // Sanity on the payload we send
    const idx = (files['index.html'] as { content: string }).content
    expect(idx).toContain('wyber-select-bridge')
    expect((files['src/App.tsx'] as { content: string }).content).toContain('data-wyber-loc="src/App.tsx:3"')

    const res = await fetch('https://preview-builder.wyberai.com/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, projectId: 'session-c-bridge-live-' + Date.now() }),
    })
    const data = await res.json() as { url?: string; error?: string }
    expect(data.url, `builder error: ${data.error}`).toBeTruthy()

    const page = await (await fetch(data.url!)).text()
    // 1. The inline bridge script survived vite build
    expect(page).toContain('wyber-select-bridge')
    expect(page).toContain('wyber-theme-override')

    // 2. data-wyber-loc made it into the compiled JS bundle
    const assetMatch = page.match(/src="([^"]+\.js)"/)
    expect(assetMatch).toBeTruthy()
    const assetUrl = new URL(assetMatch![1], data.url!).toString()
    const js = await (await fetch(assetUrl)).text()
    expect(js).toContain('data-wyber-loc')
    expect(js).toContain('src/App.tsx:3')
  }, 180_000)
})
