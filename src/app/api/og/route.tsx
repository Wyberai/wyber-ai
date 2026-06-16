import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Web, Mobile, Agents, Workflows'
  const sub = searchParams.get('sub') || 'From idea to running product, in plain English'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#09090b', padding: '60px 72px', fontFamily: 'sans-serif', justifyContent: 'space-between' }}>
        {/* Gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #0EA5E9, #8b5cf6)' }} />
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>WyberAi</span>
        </div>
        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#fafafa', lineHeight: 1.1, letterSpacing: '-0.04em', maxWidth: 900 }}>{title}</div>
          <div style={{ fontSize: 24, color: '#71717a' }}>{sub}</div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, color: '#52525b' }}>wyberai.com</span>
          <div style={{ padding: '8px 20px', borderRadius: 20, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', fontSize: 16, fontWeight: 700, color: '#0EA5E9' }}>
            Start free → 50 credits/month
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
