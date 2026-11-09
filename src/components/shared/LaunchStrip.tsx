import Link from 'next/link'

/**
 * A slim announcement strip for the WyberCode 1.0 launch (3x the credits on every paid plan, same price).
 * Shown to every region on the homepage and the pricing page, so people arriving from the launch posts see what was
 * promised. Same look as the expo banner. Remove it when the launch has passed.
 * Colours come from the Signal theme tokens (--sg-hot, --sg-soft), so the text stays readable in both dark and light mode.
 * Do not use the older --brand-text variable here: it has no light value, which made these banners invisible in light mode.
 */
export function LaunchStrip() {
  return (
    <Link
      href="/pricing"
      style={{
        display: 'block', textAlign: 'center', padding: '9px 16px', fontSize: 13, fontWeight: 600,
        color: 'var(--sg-hot, #38bdf8)', background: 'var(--sg-soft, rgba(14,165,233,0.12))', borderBottom: '1px solid rgba(14,165,233,0.35)', textDecoration: 'none',
      }}
    >
      WyberCode 1.0 is live: 3× the credits on every paid plan, same price <span style={{ color: 'var(--sg-brand, #0ea5e9)' }}>→</span>
    </Link>
  )
}

/**
 * Tech Expo Gujarat banner, India visitors only. It used to live on the older homepage only, so the Signal homepage
 * lost it. Remove after 29 Nov 2026.
 */
export function ExpoStrip() {
  return (
    <Link
      href="/gujaratexpo"
      style={{
        display: 'block', textAlign: 'center', padding: '9px 16px', fontSize: 13, fontWeight: 600,
        color: 'var(--sg-hot, #38bdf8)', background: 'var(--sg-soft, rgba(14,165,233,0.12))', borderBottom: '1px solid rgba(14,165,233,0.35)', textDecoration: 'none',
      }}
    >
      Meet WyberAi at Tech Expo Gujarat, booth S23, 27–29 Nov, Ahmedabad <span style={{ color: 'var(--sg-brand, #0ea5e9)' }}>→</span>
    </Link>
  )
}
