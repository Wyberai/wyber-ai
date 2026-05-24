'use client';
import { TEMPLATE_GALLERY, CATEGORIES } from '@/lib/templates/gallery';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function TemplatesPage() {
  const [category, setCategory] = useState('All');
  const filtered = category === 'All' ? TEMPLATE_GALLERY : TEMPLATE_GALLERY.filter(t => t.category === category);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 12px' }}>Template Gallery</h1>
          <p style={{ color: 'var(--text2)', fontSize: 16, margin: 0 }}>Start from a working app. One click to generate, then customize with AI.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: category === c ? 'var(--sky)' : 'transparent', color: category === c ? 'white' : 'var(--text2)', fontSize: 13, cursor: 'pointer', fontWeight: category === c ? 600 : 400 }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <Link key={t.id} href="/signup" style={{ textDecoration: 'none', display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', transition: 'border-color 0.15s' }} className="template-card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>{t.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 12px', lineHeight: 1.5 }}>{t.description}</p>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text3)' }}>{t.framework === 'react-vite' ? 'React' : t.framework === 'vue' ? 'Vue' : t.framework === 'vanilla' ? 'Vanilla JS' : 'Next.js'}</span>
            </Link>
          ))}
        </div>
      </div>
      <style>{`.template-card:hover { border-color: var(--sky-glow) !important; }`}</style>
      <Footer />
    </div>
  );
}
