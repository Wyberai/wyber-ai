'use client'
import { useState } from 'react'

// One reusable share row used by published apps + the Build Challenge, so every
// "I built this" moment spreads with the SAME hashtag and drives new signups.
// X / Facebook / WhatsApp have web share intents with pre-filled text; Instagram
// has none, so it uses the mobile native share sheet (navigator.share) with a
// copy-caption fallback on desktop.

export const WYBER_HASHTAG = 'BuiltOnWyber'

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
    { key: 'ig', label: 'Instagram', bg: '#E1306C', onClick: shareInstagram },
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: b.bg, color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}
          >
            {b.label}
          </a>
        ) : (
          <button
            key={b.key}
            onClick={b.onClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: b.bg, color: '#fff', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {b.label}
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
