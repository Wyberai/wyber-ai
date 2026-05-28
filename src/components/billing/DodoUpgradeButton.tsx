'use client';
import { useState } from 'react';

interface Props {
  productId: string;
  planName: string;
  label: string;
  variant?: 'primary' | 'outline';
  style?: React.CSSProperties;
}

export function DodoUpgradeButton({ productId, planName, label, variant = 'primary', style }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkout = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, planName }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Failed to start checkout');
    } catch { setError('Checkout failed. Try again.'); }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={checkout} disabled={loading} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: '10px 24px', borderRadius: 9, fontWeight: 700, fontSize: 14,
        cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s', letterSpacing: '-0.02em', width: '100%',
        border: variant === 'outline' ? '1px solid var(--sky)' : 'none',
        background: variant === 'outline' ? 'transparent' : 'var(--sky)',
        color: variant === 'outline' ? 'var(--sky)' : '#fff',
        opacity: loading ? 0.7 : 1,
        ...style,
      }}>
        {loading ? (
          <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Processing...</>
        ) : label}
      </button>
      {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 6, textAlign: 'center' }}>{error}</p>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}