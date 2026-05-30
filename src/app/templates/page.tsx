'use client';
import { TEMPLATE_GALLERY, CATEGORIES } from '@/lib/templates/gallery';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

const COMPLEXITY_LABEL: Record<string, string> = {
  starter: 'Starter',
  advanced: 'Advanced',
  complex: 'Complex',
};

const COMPLEXITY_COLOR: Record<string, string> = {
  starter: 'var(--green)',
  advanced: 'var(--sky)',
  complex: 'var(--amber)',
};

export default function TemplatesPage() {
  const [category, setCategory] = useState('All');
  const filtered = category === 'All'
    ? TEMPLATE_GALLERY
    : TEMPLATE_GALLERY.filter(t => t.category === category);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(48px,8vw,72px) clamp(16px,4vw,40px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Templates</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.1 }}>
            Start from a working app.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>
            33 production-ready templates. One click to generate, then customize with AI.
          </p>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '6px 16px', borderRadius: 20,
              border: `1px solid ${category === c ? 'var(--sky)' : 'var(--border)'}`,
              background: category === c ? 'var(--sky)' : 'transparent',
              color: category === c ? 'white' : 'var(--text2)',
              fontSize: 13, cursor: 'pointer',
              fontWeight: category === c ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}>{c}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(t => (
            <Link key={t.id} href="/signup" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '22px 20px',
                transition: 'all 0.2s',
                height: '100%',
                boxShadow: 'var(--shadow)',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--sky)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>▦</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>{t.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 14px', lineHeight: 1.55 }}>{t.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)', fontWeight: 500 }}>
                    {t.framework === 'react-vite' ? 'React' : t.framework === 'vue' ? 'Vue' : t.framework === 'vanilla' ? 'Vanilla JS' : 'Next.js'}
                  </span>
                  {t.complexity && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg2)', color: COMPLEXITY_COLOR[t.complexity], border: '1px solid var(--border)', fontWeight: 500 }}>
                      {COMPLEXITY_LABEL[t.complexity]}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 64, textAlign: 'center', padding: '40px', background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 10px' }}>
            Don't see what you need?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', margin: '0 0 24px' }}>
            Describe any app in plain English — Wyber AI will build it from scratch.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
            Start building free →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
