'use client';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function StatusPage() {
  const services = [
    { name: 'AI Generation', status: 'operational', latency: '1.2s avg', icon: 'âš¡' },
    { name: 'Live Preview', status: 'operational', latency: '28s cold start', icon: 'â—Ž' },
    { name: 'Authentication', status: 'operational', latency: '<100ms', icon: 'ðŸ”’' },
    { name: 'Database', status: 'operational', latency: '<50ms', icon: 'ðŸ—„' },
    { name: 'Deployment', status: 'operational', latency: '30s avg', icon: 'â†¥' },
    { name: 'Email', status: 'operational', latency: '<5s', icon: 'âœ‰' },
  ];

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: allOperational ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)', border: `2px solid ${allOperational ? 'var(--green)' : 'var(--red)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
            {allOperational ? 'âœ“' : '!'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>
            {allOperational ? 'All systems operational' : 'Some systems degraded'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>Last updated: {new Date().toLocaleString()}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {services.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.latency}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'operational' ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: s.status === 'operational' ? 'var(--green)' : 'var(--red)', textTransform: 'capitalize' }}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 8px' }}>Experiencing issues?</p>
          <a href="mailto:hello@wyberai.com" style={{ fontSize: 14, color: 'var(--sky)', fontWeight: 600 }}>hello@wyberai.com</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
