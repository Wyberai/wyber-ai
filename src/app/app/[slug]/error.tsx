'use client'

// Route-scoped error boundary for PUBLISHED user apps. Without this, any throw
// while rendering /app/[slug] bubbles to the platform's global error.tsx, whose
// "Dashboard" button sends the (anonymous) public visitor to /login — a broken,
// off-brand experience for someone who just opened a shared app link. This keeps
// failures neutral and self-contained: a calm message + retry, no auth wall.
export default function PublishedAppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 15, color: '#e4e4e7', fontWeight: 600 }}>This app is temporarily unavailable</div>
      <div style={{ fontSize: 13, color: '#71717a', maxWidth: 320, lineHeight: 1.5 }}>
        We couldn’t load this app right now. Please try again in a moment.
      </div>
      <button
        onClick={reset}
        style={{
          marginTop: 6,
          padding: '9px 20px',
          borderRadius: 10,
          border: 'none',
          background: '#0EA5E9',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
