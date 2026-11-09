import Link from 'next/link'

/**
 * A slim announcement strip for the WyberCode 1.0 launch (3x the credits on every paid plan, same price).
 * Shown to every region on the homepage and the pricing page, so people arriving from the launch posts see what was
 * promised. Same look as the expo banner. Remove it when the launch has passed.
 */
export function LaunchStrip() {
  return (
    <Link
      href="/pricing"
      style={{
        display: 'block', textAlign: 'center', padding: '9px 16px', fontSize: 13, fontWeight: 600,
        color: 'var(--brand-text)', background: 'rgba(14,165,233,0.12)', borderBottom: '1px solid rgba(14,165,233,0.35)', textDecoration: 'none',
      }}
    >
      WyberCode 1.0 is live: 3× the credits on every paid plan, same price <span style={{ color: '#0ea5e9' }}>→</span>
    </Link>
  )
}
