'use client';
import { useState } from 'react';

interface Props {
  priceId: string;
  label: string;
  variant?: 'primary' | 'outline';
}

export function UpgradeButton({ priceId, label, variant = 'primary' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkout = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Failed to start checkout');
    } catch { setError('Checkout failed'); }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={checkout} disabled={loading} style={{
        padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14,
        border: variant === 'outline' ? '1px solid var(--sky)' : 'none',
        background: variant === 'outline' ? 'transparent' : 'var(--sky)',
        color: variant === 'outline' ? 'var(--sky)' : '#fff',
        cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
        opacity: loading ? 0.7 : 1, transition: 'all 0.15s', width: '100%',
      }}>
        {loading ? 'Loading...' : label}
      </button>
      {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  );
}