import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') || 'Wyber Builder'
  const date = searchParams.get('date') || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #0EA5E9, #8b5cf6)', display: 'flex' }} />

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Border frame */}
        <div style={{
          position: 'absolute', inset: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          display: 'flex',
        }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '60px 80px', gap: 0 }}>
          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
            </div>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>WyberAi</span>
          </div>

          {/* Seal */}
          <div style={{
            width: 96, height: 96, borderRadius: 48,
            background: 'linear-gradient(135deg, #6366f1, #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28,
            boxShadow: '0 0 0 12px rgba(99,102,241,0.1)',
          }}>
            <span style={{ fontSize: 48 }}>🎓</span>
          </div>

          {/* Certificate label */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 12 }}>
            Certificate of Completion
          </div>

          {/* Title */}
          <div style={{ fontSize: 48, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.04em', lineHeight: 1.1, textAlign: 'center', marginBottom: 6 }}>
            Wyber Certified
          </div>
          <div style={{ fontSize: 20, color: '#8b8b9a', marginBottom: 4 }}>All Five Pillars</div>
          <div style={{ fontSize: 14, color: '#52526a', marginBottom: 32 }}>Web Apps · Mobile · AI Agents · Workflows · AI Employees</div>

          {/* Name box */}
          <div style={{
            padding: '16px 48px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>{name}</div>
            <div style={{ fontSize: 13, color: '#52526a' }}>{date}</div>
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', gap: 8, color: '#f59e0b', fontSize: 24 }}>
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 48px 40px',
        }}>
          <span style={{ fontSize: 14, color: '#3f3f46' }}>wyberai.com/learn</span>
          <div style={{
            padding: '8px 20px', borderRadius: 20,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            fontSize: 13, fontWeight: 700, color: '#6366f1',
          }}>
            Certified Builder
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
