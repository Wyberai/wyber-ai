// Shaped like the real dashboard (sidebar rail + hero + card grid) so content
// doesn't "pop in" after a spinner — it settles into place. Uses the same
// .wy-skeleton shimmer the rest of the design system already ships.
export default function Loading() {
  return (
    <div data-theme="dark" style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <aside style={{ width: 220, height: '100vh', background: 'var(--bg-surface)', borderRight: '1px solid var(--ide-border)', flexShrink: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="wy-skeleton" style={{ width: 120, height: 24 }} />
        <div className="wy-skeleton" style={{ width: '100%', height: 40, marginTop: 8 }} />
        <div className="wy-skeleton" style={{ width: '100%', height: 32 }} />
        <div className="wy-skeleton" style={{ width: '100%', height: 32 }} />
        <div className="wy-skeleton" style={{ width: '100%', height: 32 }} />
      </aside>
      <main style={{ flex: 1, overflow: 'hidden', padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div className="wy-skeleton" style={{ width: 320, height: 34, borderRadius: 8 }} />
        <div className="wy-skeleton" style={{ width: '100%', maxWidth: 640, height: 108, borderRadius: 14 }} />
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="wy-skeleton" style={{ height: 168, borderRadius: 12 }} />
          ))}
        </div>
      </main>
    </div>
  )
}
