export default function StatusPage() {
  const services = [
    { name: 'AI Generation', status: 'operational', latency: '1.2s avg' },
    { name: 'Live Preview', status: 'operational', latency: '28s cold start' },
    { name: 'Authentication', status: 'operational', latency: '<100ms' },
    { name: 'Database', status: 'operational', latency: '<50ms' },
    { name: 'Deployment', status: 'operational', latency: '30s avg' },
    { name: 'Email', status: 'operational', latency: '<5s' },
  ];
  const statusColor = { operational: '#22c55e', degraded: '#f59e0b', outage: '#ef4444' };
  const statusLabel = { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' };
  return (
    <div style={{ minHeight:'100vh', background:'#09090b', color:'#fafafa', fontFamily:'system-ui', padding:'80px 24px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
          <h1 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.03em', margin:'0 0 10px' }}>All systems operational</h1>
          <p style={{ color:'#a1a1aa', fontSize:15 }}>Last updated: {new Date().toLocaleString()}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {services.map(s => (
            <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#111113', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor[s.status as keyof typeof statusColor] }} />
                <span style={{ fontSize:14, fontWeight:500 }}>{s.name}</span>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#52525b' }}>{s.latency}</span>
                <span style={{ fontSize:12, color:statusColor[s.status as keyof typeof statusColor], fontWeight:500 }}>{statusLabel[s.status as keyof typeof statusLabel]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
