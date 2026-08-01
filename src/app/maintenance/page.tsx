export const metadata = {
  title: 'WyberAi — upgrading',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
          We&apos;re upgrading WyberAi
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#a1a1aa', marginBottom: 8 }}>
          We&apos;re making some improvements behind the scenes and will be back shortly.
          Thanks for your patience.
        </p>
        <p style={{ fontSize: 13, color: '#71717a' }}>
          Already-published apps built with WyberAi are unaffected and continue running normally.
        </p>
      </div>
    </div>
  )
}
