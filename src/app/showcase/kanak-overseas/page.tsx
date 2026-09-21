import type { Metadata } from 'next'

// Client-facing sales demo — a rice-export concept site built to show
// prospective exporters (sourced via warm referral) what WyberAi can build
// for them. Static HTML/CSS/JS under public/showcase/kanak-overseas/, framed
// here rather than ported to React so its own styles never collide with the
// main site's global CSS. Same pattern as src/app/showcase/glocal-electronics.
export const metadata: Metadata = {
  title: 'Kanak Overseas — Concept Demo',
  robots: { index: false, follow: false },
}

export default function KanakOverseasShowcase() {
  return (
    <iframe
      src="/showcase/kanak-overseas/index.html"
      title="Kanak Overseas concept demo"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
    />
  )
}
