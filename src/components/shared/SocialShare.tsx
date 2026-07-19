'use client'
import { useState } from 'react'

// One reusable share row used by published apps + the Build Challenge, so every
// "I built this" moment spreads with the SAME hashtag and drives new signups.
// X / Facebook / WhatsApp have web share intents with pre-filled text; Instagram
// has none, so it uses the mobile native share sheet (navigator.share) with a
// copy-caption fallback on desktop.

export const WYBER_HASHTAG = 'BuiltOnWyber'

// Official brand glyphs (single-path where possible), sized to 18px and tinted
// white so they read on each platform's brand colour.
const ICONS: Record<string, React.ReactNode> = {
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  fb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  wa: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.463.044.104 5.4.101 11.986c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.96 11.96 0 005.71 1.454h.006c6.585 0 11.946-5.357 11.949-11.945a11.9 11.9 0 00-3.48-8.418"/></svg>
  ),
  ig: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  ),
}

type Btn = { key: string; label: string; bg: string; href?: string; onClick?: () => void }

export function SocialShare({
  url,
  text,
  align = 'left',
}: {
  url: string
  text?: string
  align?: 'left' | 'center'
}) {
  const [copied, setCopied] = useState(false)

  const msg = text || 'I built this with WyberAi — no code, live in minutes.'
  const caption = `${msg} #${WYBER_HASHTAG}`
  const u = encodeURIComponent(url)
  const captionAndUrl = encodeURIComponent(`${caption} ${url}`)

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(`${caption} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked — ignore */ }
  }

  // Instagram can't be posted to from the web. On mobile the native share sheet
  // includes Instagram/Stories; on desktop we copy the caption and open IG.
  const shareInstagram = async () => {
    const nav = navigator as Navigator & { share?: (d: { text: string; url: string }) => Promise<void> }
    if (typeof nav.share === 'function') {
      try { await nav.share({ text: caption, url }) } catch { /* user cancelled */ }
      return
    }
    await copyCaption()
    window.open('https://www.instagram.com/', '_blank', 'noopener')
  }

  const buttons: Btn[] = [
    { key: 'x', label: 'X', bg: '#000000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${u}&hashtags=${WYBER_HASHTAG}` },
    { key: 'fb', label: 'Facebook', bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${encodeURIComponent(caption)}` },
    { key: 'wa', label: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${captionAndUrl}` },
    { key: 'ig', label: 'Instagram', bg: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)', onClick: shareInstagram },
  ]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: align === 'center' ? 'center' : 'flex-start', alignItems: 'center' }}>
      {buttons.map(b =>
        b.href ? (
          <a
            key={b.key}
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${b.label}`}
            title={`Share on ${b.label}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: b.bg, color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}
          >
            {ICONS[b.key]}{b.label}
          </a>
        ) : (
          <button
            key={b.key}
            onClick={b.onClick}
            aria-label={`Share on ${b.label}`}
            title={`Share on ${b.label}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: b.bg, color: '#fff', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {ICONS[b.key]}{b.label}
          </button>
        )
      )}
      <button
        onClick={copyCaption}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', fontSize: 12.5, fontWeight: 700, border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
      <span style={{ fontSize: 12, color: '#52525b', fontWeight: 600 }}>#{WYBER_HASHTAG}</span>
    </div>
  )
}
