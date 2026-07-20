import { StartBuildButton } from '../build/StartBuildButton';

// A static, honestly-labeled illustrative dashboard — not a live provisioned
// project (that needs real backend generation, which this page can't trigger
// for an anonymous visitor). This exists so a visitor sees the FULL picture
// (every widget at once) in zero seconds, before deciding what to build.
const SAMPLE_CHANNELS = [
  { name: 'Amazon', revenue: 18420, pct: 100 },
  { name: 'Shopify', revenue: 9860, pct: 54 },
  { name: 'Etsy', revenue: 4130, pct: 22 },
];

const SAMPLE_ORDERS = [
  { date: 'Jul 18', channel: 'Amazon', product: 'Ceramic Mug — Set of 4', revenue: 62, margin: 21 },
  { date: 'Jul 18', channel: 'Shopify', product: 'Canvas Tote Bag', revenue: 34, margin: 16 },
  { date: 'Jul 17', channel: 'Etsy', product: 'Hand-poured Candle', revenue: 28, margin: 12 },
  { date: 'Jul 17', channel: 'Amazon', product: 'Ceramic Mug — Set of 4', revenue: 62, margin: 21 },
];

const SAMPLE_LOW_STOCK = [
  { product: 'Canvas Tote Bag', qty: 4, threshold: 10 },
  { product: 'Hand-poured Candle', qty: 2, threshold: 15 },
];

const fmt = (n: number) => `$${n.toLocaleString()}`;

export function ExampleDashboard() {
  const s = { card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)' };
  const color = '#0EA5E9';
  const maxChannel = SAMPLE_CHANNELS[0].revenue;
  const totalRevenue = SAMPLE_CHANNELS.reduce((a, c) => a + c.revenue, 0);
  const totalMargin = Math.round(totalRevenue * 0.37);

  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
        Example data — not your numbers yet
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Total revenue</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalRevenue)}</div>
        </div>
        <div style={{ background: s.card, border: `1px solid ${color}40`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Net margin</div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{fmt(totalMargin)}</div>
        </div>
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Low-stock items</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{SAMPLE_LOW_STOCK.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Revenue by channel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SAMPLE_CHANNELS.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, color: s.muted, width: 70, flexShrink: 0 }}>{c.name}</div>
              <div style={{ flex: 1, background: s.card, borderRadius: 6, overflow: 'hidden', height: 20 }}>
                <div style={{ width: `${Math.max(4, (c.revenue / maxChannel) * 100)}%`, height: '100%', background: color, borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 12, color: s.text, width: 70, textAlign: 'right', flexShrink: 0 }}>{fmt(c.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Low-stock alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SAMPLE_LOW_STOCK.map(item => (
              <div key={item.product} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#ef444410', border: '1px solid #ef444430', borderRadius: 10, fontSize: 12 }}>
                <span style={{ color: s.text }}>{item.product}</span>
                <span style={{ color: '#fca5a5' }}>{item.qty} left (reorder at {item.threshold})</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Recent orders</div>
          <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
              <tbody>
                {SAMPLE_ORDERS.map((o, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 10px', color: s.dim, borderBottom: i < SAMPLE_ORDERS.length - 1 ? `1px solid ${s.border}` : 'none', whiteSpace: 'nowrap' }}>{o.date}</td>
                    <td style={{ padding: '8px 10px', color: s.muted, borderBottom: i < SAMPLE_ORDERS.length - 1 ? `1px solid ${s.border}` : 'none', whiteSpace: 'nowrap' }}>{o.channel}</td>
                    <td style={{ padding: '8px 10px', color: s.text, borderBottom: i < SAMPLE_ORDERS.length - 1 ? `1px solid ${s.border}` : 'none' }}>{o.product}</td>
                    <td style={{ padding: '8px 10px', color: color, borderBottom: i < SAMPLE_ORDERS.length - 1 ? `1px solid ${s.border}` : 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>+{fmt(o.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <StartBuildButton
          prompt="Build an ecommerce seller dashboard web app: an Orders page to log sales from any channel (Amazon, Shopify, Etsy, or custom) with channel, sale price, fee, and cost attached; a Products page tracking stock shared across channels with a low-stock indicator; a Margin page showing profit per order by channel and month; and a Dashboard page summarizing revenue, margin, and channel breakdown."
          target="web"
          slug="ecommerce-example-full"
          label="Build this, with my real numbers →"
          color={color}
        />
      </div>
    </div>
  );
}
