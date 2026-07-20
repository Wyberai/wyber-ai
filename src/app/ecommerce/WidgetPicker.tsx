'use client';
import { useState } from 'react';
import { StartBuildButton } from '../build/StartBuildButton';

// Turns a visitor's picks into the actual build prompt — same wyber-pending-prompt
// contract every other CTA on the site uses, just composed dynamically instead of
// static, so what they asked for is exactly what gets built.
interface Widget {
  id: string;
  label: string;
  desc: string;
  fragment: string;
}

const WIDGETS: Widget[] = [
  { id: 'margin', label: 'Margin tracker', desc: 'Real profit per order, after fees and cost', fragment: 'a Margin page showing profit per order after channel fees and cost price, broken down by channel and by month' },
  { id: 'inventory', label: 'Inventory & low-stock alerts', desc: 'One stock count, every channel', fragment: 'a Products page tracking stock quantity shared across all channels with a low-stock indicator and reorder threshold' },
  { id: 'orders', label: 'Multi-channel order feed', desc: 'Every sale in one place', fragment: 'an Orders page to log sales from any channel (Amazon, Shopify, Etsy, or custom) with channel, sale price, fee, and cost attached to each' },
  { id: 'channels', label: 'Channel fee comparison', desc: 'See which channel actually pays', fragment: 'a Channels page listing each place you sell with its fee percentage, so the margin difference between channels is visible at a glance' },
  { id: 'trends', label: 'Revenue trends', desc: 'Month over month, not just this week', fragment: 'a Dashboard page charting total revenue and net margin by month' },
  { id: 'topproducts', label: 'Top products', desc: "What's actually making you money", fragment: 'a Top Products view ranking items by total revenue and margin contribution' },
];

const DEFAULT_SELECTED = ['margin', 'inventory', 'orders'];

function composePrompt(selected: Set<string>): string {
  const chosen = WIDGETS.filter(w => selected.has(w.id));
  if (chosen.length === 0) {
    return 'Build an ecommerce seller dashboard web app: an Orders page, a Products page with stock levels, and a Dashboard page summarizing revenue and margin.';
  }
  const fragments = chosen.map(w => w.fragment).join('; ');
  return `Build an ecommerce seller dashboard web app: ${fragments}. Tie it together with a Dashboard page summarizing the totals across everything above.`;
}

export function WidgetPicker() {
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_SELECTED));
  const s = { card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)' };
  const color = '#0EA5E9';

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const prompt = composePrompt(selected);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 24 }}>
        {WIDGETS.map(w => {
          const isOn = selected.has(w.id);
          return (
            <button
              key={w.id}
              onClick={() => toggle(w.id)}
              style={{
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: 12,
                border: `1.5px solid ${isOn ? color : s.border}`,
                background: isOn ? `${color}12` : s.card,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${isOn ? color : s.dim}`,
                  background: isOn ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isOn && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.text }}>{w.label}</div>
              </div>
              <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.5, marginLeft: 24 }}>{w.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <StartBuildButton
          prompt={prompt}
          target="web"
          slug="ecommerce-widget-picker"
          label={`Build my dashboard (${selected.size || 3} widgets) →`}
          color={color}
          projectLabel="Ecommerce Dashboard"
        />
        <span style={{ fontSize: 12, color: s.dim }}>Free to start — no card required.</span>
      </div>
    </div>
  );
}
