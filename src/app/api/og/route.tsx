import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const title = searchParams.get('title') || 'Build. Think. Act.'
  const desc = searchParams.get('desc') || 'Apps. Agents. Automations. One platform.'

  // Satori (which ImageResponse uses) needs TTF/OTF font data, not woff2 —
  // fetched at request time since the edge runtime has no filesystem access.
  const [regular, bold] = await Promise.all([
    fetch(new URL('/fonts/GeneralSans-600.ttf', origin)).then(r => r.arrayBuffer()),
    fetch(new URL('/fonts/GeneralSans-700.ttf', origin)).then(r => r.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: '#09090b',
          padding: '64px 72px',
          fontFamily: 'General Sans',
        }}
      >
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          display: 'flex',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '60%', height: '60%',
          background: 'radial-gradient(ellipse at 0% 0%, rgba(14,165,233,0.25) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#0EA5E9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.04em' }}>
            WyberAi
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 56, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20, maxWidth: 800 }}>
          {title}
        </div>

        {/* Desc */}
        <div style={{ fontSize: 24, color: '#71717a', marginBottom: 48, maxWidth: 700 }}>
          {desc}
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Apps', 'Agents', 'Automations'].map(p => (
            <div key={p} style={{
              padding: '8px 20px', borderRadius: 999,
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid rgba(14,165,233,0.3)',
              fontSize: 16, fontWeight: 700, color: '#0EA5E9',
            }}>{p}</div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: 'absolute', top: 48, right: 72, fontSize: 18, color: '#3f3f46', fontWeight: 500 }}>
          wyberai.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'General Sans', data: regular, weight: 600, style: 'normal' },
        { name: 'General Sans', data: bold, weight: 700, style: 'normal' },
      ],
    }
  )
}
