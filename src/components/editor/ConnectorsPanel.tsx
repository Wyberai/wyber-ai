'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';

const CONNECTORS = [
  { id: 'supabase', name: 'Supabase', desc: 'Database, Auth, Storage', icon: '🗄', color: '#3FCF8E', category: 'Database', prompt: 'Add Supabase integration with auth and database to this app. Use @supabase/supabase-js.' },
  { id: 'stripe', name: 'Stripe', desc: 'Payments & subscriptions', icon: '💳', color: '#635BFF', category: 'Payments', prompt: 'Add Stripe payment integration with a checkout button.' },
  { id: 'resend', name: 'Resend', desc: 'Email delivery', icon: '📧', color: '#0EA5E9', category: 'Email', prompt: 'Add email functionality using Resend API.' },
  { id: 'openai', name: 'OpenAI', desc: 'GPT models & embeddings', icon: '🤖', color: '#74AA9C', category: 'AI', prompt: 'Add OpenAI API integration for AI features.' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude AI models', icon: '🧠', color: '#CC785C', category: 'AI', prompt: 'Add Anthropic Claude API integration.' },
  { id: 'firebase', name: 'Firebase', desc: 'Google auth & Firestore', icon: '🔥', color: '#FFCA28', category: 'Database', prompt: 'Add Firebase authentication and Firestore database.' },
  { id: 'planetscale', name: 'PlanetScale', desc: 'MySQL-compatible database', icon: '🌍', color: '#F4F4F5', category: 'Database', prompt: 'Add PlanetScale database connection.' },
  { id: 'cloudinary', name: 'Cloudinary', desc: 'Image & video CDN', icon: '🖼', color: '#3448C5', category: 'Storage', prompt: 'Add Cloudinary for image upload and optimization.' },
  { id: 'mapbox', name: 'Mapbox', desc: 'Maps & location data', icon: '🗺', color: '#4264FB', category: 'Maps', prompt: 'Add an interactive Mapbox map to this app.' },
  { id: 'twilio', name: 'Twilio', desc: 'SMS & voice', icon: '📱', color: '#F22F46', category: 'Communication', prompt: 'Add Twilio SMS notification functionality.' },
  { id: 'pusher', name: 'Pusher', desc: 'Real-time websockets', icon: '⚡', color: '#300D4F', category: 'Real-time', prompt: 'Add Pusher for real-time updates and live collaboration.' },
  { id: 'algolia', name: 'Algolia', desc: 'Search & discovery', icon: '🔍', color: '#003DFF', category: 'Search', prompt: 'Add Algolia search with instant results.' },
];

export function ConnectorsPanel({ projectId }: { projectId: string }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const filtered = CONNECTORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map(c => c.category))];

  const handleAdd = async (connector: typeof CONNECTORS[0]) => {
    setAdding(connector.id);
    // Send the connector prompt to chat
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: connector.prompt }));
    setTimeout(() => setAdding(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--ide-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Connectors</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search connectors..."
          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.filter(c => c.category === cat).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: c.color + '18', border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{c.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(c)}
                    disabled={adding === c.id}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: adding === c.id ? 'rgba(14,165,233,0.1)' : 'transparent', color: adding === c.id ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.15s' }}
                  >
                    {adding === c.id ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
