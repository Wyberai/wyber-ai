import type { Metadata } from 'next'

// Client-facing sales demo — a full AI-native ecommerce concept built to show
// a prospective customer (Glocal Electronics) what WyberAi can build for them.
// Static HTML/CSS/JS under public/showcase/glocal-electronics/, framed here
// rather than ported to React so its own styles never collide with the main
// site's global CSS.
export const metadata: Metadata = {
  title: 'Glocal Electronics — Concept Demo',
  robots: { index: false, follow: false },
}

export default function GlocalElectronicsShowcase() {
  return (
    <iframe
      src="/showcase/glocal-electronics/index.html"
      title="Glocal Electronics concept demo"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
    />
  )
}
