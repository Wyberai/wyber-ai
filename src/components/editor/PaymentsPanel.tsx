'use client';
import { useState, useEffect } from 'react';

// Payment providers pulled from the same catalog ConnectorsPanel uses — this
// panel doesn't duplicate the integration logic, it's a guided, opinionated
// front door onto the same "add secret → tell the AI to wire it up" flow,
// framed around "accept payments" instead of a generic connector list.
const PAYMENT_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', desc: 'The default choice — cards, subscriptions, invoices, global', icon: '💳', color: '#635BFF', recommended: true, prompt: 'Add Stripe payment integration with checkout, subscriptions, and webhook handling.', secretKeys: [{ name: 'STRIPE_SECRET_KEY', placeholder: 'sk_live_... or sk_test_...' }] },
  { id: 'razorpay', name: 'Razorpay', desc: 'Best for India — UPI, cards, netbanking', icon: '💰', color: '#0C2451', recommended: false, prompt: 'Add Razorpay payment gateway with checkout and subscription billing.', secretKeys: [{ name: 'RAZORPAY_KEY_ID', placeholder: 'key id' }, { name: 'RAZORPAY_KEY_SECRET', placeholder: 'key secret' }] },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', desc: 'Handles sales tax/VAT for you — good for digital products', icon: '🍋', color: '#FFC233', recommended: false, prompt: 'Add Lemon Squeezy for product sales with checkout overlay and license key validation.', secretKeys: [{ name: 'LEMONSQUEEZY_API_KEY', placeholder: 'api key' }] },
  { id: 'paypal', name: 'PayPal', desc: 'Widely recognized checkout button', icon: '🅿', color: '#003087', recommended: false, prompt: 'Add PayPal payment buttons with checkout and order management.', secretKeys: [{ name: 'PAYPAL_CLIENT_ID', placeholder: 'client id' }, { name: 'PAYPAL_CLIENT_SECRET', placeholder: 'client secret' }] },
];

export function PaymentsPanel({ projectId, onSwitchToChat }: { projectId: string; onSwitchToChat?: () => void }) {
  const [vaultNames, setVaultNames] = useState<Set<string>>(new Set());

  const loadVault = () => {
    fetch('/api/secrets')
      .then(r => r.json())
      .then(d => setVaultNames(new Set((d.secrets ?? []).map((s: { name: string }) => s.name.toUpperCase()))))
      .catch(() => {});
  };

  useEffect(() => {
    loadVault();
    window.addEventListener('wyber:secrets-saved', loadVault);
    return () => window.removeEventListener('wyber:secrets-saved', loadVault);
  }, []);

  const sendToChat = (eventName: string, detail: unknown) => {
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent(eventName, { detail })), 60);
  };

  const isConnected = (p: typeof PAYMENT_PROVIDERS[0]) => p.secretKeys.every(k => vaultNames.has(k.name.toUpperCase()));

  const connect = (p: typeof PAYMENT_PROVIDERS[0]) => {
    if (isConnected(p)) { sendToChat('wyber:chat-prompt', p.prompt); return; }
    sendToChat('wyber:request-secrets', { prompt: p.prompt, group: { label: p.name, icon: p.icon, color: p.color, keys: p.secretKeys } });
  };

  const anyConnected = PAYMENT_PROVIDERS.some(isConnected);

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', height: '100%' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)', marginBottom: 4 }}>💳 Accept payments</div>
        <p style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.6, margin: 0 }}>
          Add real payments to your app — checkout, subscriptions, invoices. Pick a provider, add your API key, and WyberAi wires up the checkout flow and webhooks for you.
        </p>
      </div>

      {anyConnected && (
        <div style={{ fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          ✓ A payment provider is already connected on this project.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PAYMENT_PROVIDERS.map(p => {
          const connected = isConnected(p);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: p.recommended ? '1px solid rgba(99,91,255,0.35)' : '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color + '18', border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)' }}>{p.name}</span>
                  {p.recommended && <span style={{ fontSize: 9, fontWeight: 700, color: '#635BFF', background: 'rgba(99,91,255,0.12)', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 1 }}>{p.desc}</div>
              </div>
              <button
                onClick={() => connect(p)}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: 'none', flexShrink: 0, fontFamily: 'inherit',
                  background: connected ? 'rgba(34,197,94,0.12)' : p.color,
                  color: connected ? '#22c55e' : '#fff',
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {connected ? '✓ Connected' : 'Set up'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--ide-text3)', opacity: 0.75, lineHeight: 1.5 }}>
        Your API key is stored encrypted in your secrets vault and injected into every deploy — never exposed to the browser or committed to your repo.
      </div>
    </div>
  );
}
