export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        <rect width="32" height="32" rx="8" fill="#0EA5E9" opacity="0.8"/>
        <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      </svg>
      <div style={{
        width: 120,
        height: 3,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: '#0EA5E9',
          borderRadius: 999,
          animation: 'slide 1.2s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
        @keyframes slide { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }
      `}</style>
    </div>
  )
}
