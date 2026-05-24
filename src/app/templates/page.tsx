'use client';
import { TEMPLATE_GALLERY, CATEGORIES } from '@/lib/templates/gallery';
import { useState } from 'react';
import Link from 'next/link';

export default function TemplatesPage() {
  const [category, setCategory] = useState('All');
  const filtered = category === 'All' ? TEMPLATE_GALLERY : TEMPLATE_GALLERY.filter(t => t.category === category);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Wyber <span style={{ color: '#7C3AED' }}>AI</span></span>
        </Link>
        <Link href="/signup" style={{ padding: '8px 18px', borderRadius: 8, background: '#7C3AED', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Start free →</Link>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 12px' }}>Template Gallery</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>Start from a working app. One click to generate, then customize with AI.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: category === c ? '#7C3AED' : 'transparent', color: category === c ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: category === c ? 600 : 400 }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <Link key={t.id} href="/signup" style={{ textDecoration: 'none', display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', transition: 'border-color 0.15s' }} className="template-card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{t.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>{t.description}</p>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>{t.framework === 'react-vite' ? 'React' : t.framework === 'vue' ? 'Vue' : t.framework === 'vanilla' ? 'Vanilla JS' : 'Next.js'}</span>
            </Link>
          ))}
        </div>
      </div>
      <style>{`.template-card:hover { border-color: rgba(124,58,237,0.4) !important; }`}</style>
    </div>
  );
}
