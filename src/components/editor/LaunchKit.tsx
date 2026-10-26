'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { track } from '@/lib/track'

// Launch Kit — the "now get people to use it" step after publishing, inside
// TopBar's Publish & Share modal. Three things a maker needs to launch:
//   1. a share card (the og:image every chat app shows for the link),
//   2. a QR code (for shop counters, posters, events),
//   3. posts written about THEIR app for each channel (/api/launch-kit).
// Rendered inside an ErrorBoundary by TopBar so a failure here can never
// break publishing itself.

type Channel = 'whatsapp' | 'linkedin' | 'x' | 'instagram' | 'producthunt'
type Kit = {
  url: string
  posts: { whatsapp: string; linkedin: string; x: string; instagram: string }
  productHunt: { tagline: string; description: string }
}

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'producthunt', label: 'Product Hunt' },
]

const label: React.CSSProperties = { fontSize: 11, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
const smallBtn: React.CSSProperties = { background: 'none', border: '1px solid var(--ide-border)', borderRadius: 6, color: 'var(--ide-text2)', cursor: 'pointer', padding: '5px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', fontFamily: 'inherit' }

export function LaunchKit({ projectId, liveUrl }: { projectId: string; liveUrl: string }) {
  const slug = liveUrl.split('/app/')[1]?.split(/[/?#]/)[0] ?? ''
  const [qr, setQr] = useState('')
  const [kit, setKit] = useState<Kit | null>(null)
  const [drafts, setDrafts] = useState<Record<Channel, string>>({ whatsapp: '', linkedin: '', x: '', instagram: '', producthunt: '' })
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(liveUrl, { width: 640, margin: 2, color: { dark: '#0b0b0e', light: '#ffffff' } })
      .then(setQr).catch(() => setQr(''))
  }, [liveUrl])

  const writePosts = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/launch-kit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong — try again.'); return }
      setKit(data)
      setDrafts({
        ...data.posts,
        producthunt: `${data.productHunt.tagline}\n\n${data.productHunt.description}`,
      })
      track('launch_kit_generated', { projectId })
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* blocked */ }
  }

  const text = drafts[channel]
  // Where "Post" goes. WhatsApp and X take pre-filled text; LinkedIn,
  // Instagram and Product Hunt don't, so the text is copied first.
  const target: Record<Channel, { href: string; copyFirst: boolean; cta: string }> = {
    whatsapp: { href: `https://wa.me/?text=${encodeURIComponent(text)}`, copyFirst: false, cta: 'Send on WhatsApp' },
    x: { href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, copyFirst: false, cta: 'Post on X' },
    linkedin: { href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(kit?.url || liveUrl)}`, copyFirst: true, cta: 'Copy & open LinkedIn' },
    instagram: { href: 'https://www.instagram.com/', copyFirst: true, cta: 'Copy & open Instagram' },
    producthunt: { href: 'https://www.producthunt.com/posts/new', copyFirst: true, cta: 'Copy & open Product Hunt' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={label}>Launch kit</span>

      {/* Share card + QR */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {slug && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/og/app/${slug}`} alt="Share card preview" style={{ width: '100%', aspectRatio: '1200 / 630', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)' }} />
            <a href={`/api/og/app/${slug}`} download={`${slug}-share-card.png`} onClick={() => track('launch_kit_card_downloaded', { projectId })} style={{ ...smallBtn, textAlign: 'center' }}>Download share card</a>
          </div>
        )}
        {qr && (
          <div style={{ width: 108, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code for your app" style={{ width: 108, height: 108, borderRadius: 8, border: '1px solid var(--ide-border)', background: '#fff' }} />
            <a href={qr} download={`${slug || 'app'}-qr.png`} onClick={() => track('launch_kit_qr_downloaded', { projectId })} style={{ ...smallBtn, textAlign: 'center' }}>Download QR</a>
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>
        The share card is what people see when your link is shared. Print the QR code for a counter, poster or event.
      </span>

      {/* Posts */}
      {!kit ? (
        <button onClick={writePosts} disabled={loading}
          style={{ background: loading ? 'var(--bg-elevated)' : '#0EA5E9', color: loading ? 'var(--ide-text3)' : '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Writing your launch posts…' : 'Write my launch posts'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CHANNELS.map(c => (
              <button key={c.id} onClick={() => setChannel(c.id)}
                style={{ ...smallBtn, borderColor: channel === c.id ? '#0EA5E9' : 'var(--ide-border)', color: channel === c.id ? '#0EA5E9' : 'var(--ide-text2)', background: channel === c.id ? 'rgba(14,165,233,0.08)' : 'none' }}>
                {c.label}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setDrafts(d => ({ ...d, [channel]: e.target.value }))} rows={channel === 'linkedin' ? 8 : 5}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: 'var(--bg-elevated)', color: 'var(--ide-text)', border: '1px solid var(--ide-border)', borderRadius: 8, padding: 10, fontSize: 12.5, lineHeight: 1.5, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => { copy(text); track('launch_kit_copied', { channel }) }} style={smallBtn}>{copied ? 'Copied' : 'Copy'}</button>
            <a href={target[channel].href} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (target[channel].copyFirst) copy(text); track('launch_kit_posted', { channel }) }}
              style={{ ...smallBtn, background: '#0EA5E9', borderColor: '#0EA5E9', color: '#fff' }}>
              {target[channel].cta}
            </a>
            <button onClick={writePosts} disabled={loading} style={{ ...smallBtn, marginLeft: 'auto', border: 'none', color: 'var(--ide-text3)' }}>
              {loading ? 'Rewriting…' : 'Rewrite'}
            </button>
          </div>
        </div>
      )}
      {error && <span style={{ fontSize: 11.5, color: '#ef4444' }}>{error}</span>}
    </div>
  )
}
