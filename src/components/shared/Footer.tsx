'use client';
import Link from 'next/link';
import { WyberLogo } from '@/components/shared/WyberLogo';

const COLS = [
  { heading: 'Product',   links: [['Pricing','/pricing'],['Web Apps','/gallery'],['Connectors','/connectors'],['Changelog','/changelog'],['Status','/status']] },
  { heading: 'Resources', links: [['Learning Paths','/learn'],['Documentation','/docs'],['Use Cases','/use-cases'],['Blog','/blog']] },
  { heading: 'Compare',   links: [['vs Lovable','/vs/lovable'],['vs Bolt','/vs/bolt'],['vs v0','/vs/v0'],['vs Replit','/vs/replit'],['vs Cursor','/vs/cursor']] },
  { heading: 'Company',   links: [['Founders','/founders'],['Affiliates','/affiliates'],['Community','/community'],['Privacy','/privacy'],['Terms','/terms']] },
];

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: 'clamp(40px,5vw,60px) clamp(20px,5vw,40px) clamp(24px,3vw,32px)',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(4,1fr)', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <WyberLogo markSize={24} wordmarkSize={15} />
            </Link>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, marginBottom: 16, maxWidth: 220 }}>
              Turn plain English into full-stack apps. Build, preview, and deploy — before lunch.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
              A product by{' '}
              <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sky)', fontWeight: 500 }}>SignalPulse Technologies</a>
              <br/>Wyoming, USA · hello@wyberai.com
            </p>
            {/* Socials */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[
                ['𝕏', 'https://twitter.com/wyberai', 'Twitter'],
                ['⌥', 'https://github.com/Wyberai', 'GitHub'],
                ['◉', 'https://discord.gg/A5KsFv2P', 'Discord'],
              ].map(([icon, href, label]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" title={label}
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sky)'; (e.currentTarget as HTMLElement).style.color = 'var(--sky)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}
                >{icon}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.heading}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(([label, href]) => (
                  <Link key={href} href={href}
                    style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, transition: 'color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>© 2026 SignalPulse Technologies LLC. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Privacy','/privacy'],['Terms','/terms'],['Cookies','/cookies']].map(([l,h]) => (
              <Link key={h} href={h} style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
