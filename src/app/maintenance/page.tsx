export const metadata = {
  title: 'WyberAi — leveling up',
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
          We&apos;re leveling up WyberAi
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#a1a1aa', marginBottom: 8 }}>
          We&apos;re rebuilding core parts of the platform for more reliable builds and better
          pricing. Back shortly — thanks for your patience.
        </p>
        <p style={{ fontSize: 13, color: '#71717a' }}>
          Already-published apps built with WyberAi keep running normally.
        </p>
      </div>
    </div>
  )
}
