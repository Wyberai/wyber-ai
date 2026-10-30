import { describe, it, expect } from 'vitest'
import {
  applyGrowKit, removeGrowKit, readGrowConfig, canApplyGrowKit, isGrowKitInstalled,
  normalizeWhatsApp, isValidUpiId, upiLink, whatsAppLink, buildLocalBusinessJsonLd,
  EMPTY_GROW_CONFIG, type GrowConfig,
} from './grow-kit'

const file = (content: string, language = 'typescript') => ({ content, language })
const content = (v: unknown) => (v as { content: string }).content

const MAIN = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);`

const HTML = `<!doctype html>
<html>
  <head>
    <title>Shop</title>
  </head>
  <body><div id="root"></div></body>
</html>`

const APP_FILES = () => ({
  'index.html': file(HTML, 'html'),
  'src/main.tsx': file(MAIN),
  'src/App.tsx': file('export default function App() { return <div>Hi</div> }'),
})

const CFG: GrowConfig = {
  ...EMPTY_GROW_CONFIG,
  businessName: 'Sharma Stores',
  whatsapp: '98765 43210',
  upiId: 'sharma@okicici',
  address: '12 MG Road',
  city: 'Pune',
  hours: 'Mo-Sa 10:00-20:00',
}

describe('number + UPI helpers', () => {
  it('adds +91 to 10-digit Indian mobiles only', () => {
    expect(normalizeWhatsApp('98765 43210')).toBe('919876543210')
    expect(normalizeWhatsApp('+91 98765-43210')).toBe('919876543210')
    expect(normalizeWhatsApp('09876543210')).toBe('919876543210')
    expect(normalizeWhatsApp('+1 415 555 0100')).toBe('14155550100')
  })
  it('validates UPI IDs', () => {
    expect(isValidUpiId('sharma@okicici')).toBe(true)
    expect(isValidUpiId('9876543210@ybl')).toBe(true)
    expect(isValidUpiId('sharma')).toBe(false)
    expect(isValidUpiId('a b@ok')).toBe(false)
  })
  it('builds links', () => {
    expect(whatsAppLink('9876543210', 'Hi there')).toBe('https://wa.me/919876543210?text=Hi%20there')
    expect(upiLink('sharma@okicici', 'Sharma Stores')).toBe('upi://pay?pa=sharma%40okicici&pn=Sharma+Stores&cu=INR')
  })
})

describe('applyGrowKit', () => {
  it('only applies to web apps with index.html + entry', () => {
    expect(canApplyGrowKit(APP_FILES())).toBe(true)
    expect(canApplyGrowKit({ 'App.tsx': file('x') })).toBe(false)
    expect(() => applyGrowKit({ 'App.tsx': file('x') }, CFG, { qrSvg: '' })).toThrow()
  })

  it('writes kit files, one mount import and JSON-LD without touching App', () => {
    const before = APP_FILES()
    const out = applyGrowKit(before, CFG, { qrSvg: '<svg>qr</svg>', siteUrl: 'https://wyberai.com/app/sharma' })
    expect(Object.keys(out)).toEqual(expect.arrayContaining([
      'src/wyber-grow/config.ts', 'src/wyber-grow/GrowWidgets.tsx', 'src/wyber-grow/mount.tsx',
    ]))
    expect(out['src/App.tsx']).toBe(before['src/App.tsx'])
    expect(content(out['src/main.tsx']).match(/wyber-grow\/mount/g)).toHaveLength(1)
    expect(content(out['src/wyber-grow/GrowWidgets.tsx'])).toContain('<svg>qr</svg>')
    const html = content(out['index.html'])
    expect(html).toContain('"@type": "LocalBusiness"')
    expect(html).toContain('"addressLocality": "Pune"')
    expect(html).toContain('"url": "https://wyberai.com/app/sharma"')
    expect(html.indexOf('wyber-grow:end')).toBeLessThan(html.indexOf('</head>'))
    // input not mutated
    expect(content(before['src/main.tsx'])).toBe(MAIN)
  })

  it('is idempotent and round-trips config', () => {
    const once = applyGrowKit(APP_FILES(), CFG, { qrSvg: '' })
    const twice = applyGrowKit(once, { ...CFG, city: 'Mumbai' }, { qrSvg: '' })
    expect(content(twice['src/main.tsx']).match(/wyber-grow\/mount/g)).toHaveLength(1)
    expect(content(twice['index.html']).match(/wyber-grow:start/g)).toHaveLength(1)
    expect(content(twice['index.html'])).toContain('Mumbai')
    expect(content(twice['index.html'])).not.toContain('Pune')
    const read = readGrowConfig(twice)
    expect(read?.city).toBe('Mumbai')
    expect(read?.whatsapp).toBe('919876543210')
    expect(isGrowKitInstalled(twice)).toBe(true)
  })

  it('escapes </script> in business data', () => {
    const ld = buildLocalBusinessJsonLd({ ...CFG, businessName: 'Evil</script><script>alert(1)' })
    expect(ld).not.toContain('</script>')
  })

  it('writes .jsx files for a JS app with no TS-only syntax', () => {
    const js = { 'index.html': file(HTML, 'html'), 'src/main.jsx': file(MAIN.replace('!)', ')'), 'javascript') }
    const out = applyGrowKit(js, CFG, { qrSvg: '' })
    expect(out['src/wyber-grow/GrowWidgets.jsx']).toBeDefined()
    expect(out['src/wyber-grow/config.js']).toBeDefined()
    expect(content(out['src/wyber-grow/GrowWidgets.jsx'])).not.toContain('as const')
    expect(readGrowConfig(out)?.businessName).toBe('Sharma Stores')
  })
})

describe('removeGrowKit', () => {
  it('restores entry + index.html exactly', () => {
    const before = APP_FILES()
    const out = removeGrowKit(applyGrowKit(before, CFG, { qrSvg: '' }))
    expect(Object.keys(out).some(p => p.startsWith('src/wyber-grow/'))).toBe(false)
    expect(content(out['index.html'])).toBe(HTML)
    expect(content(out['src/main.tsx']).trim()).toBe(MAIN.trim())
    expect(isGrowKitInstalled(out)).toBe(false)
  })
})
