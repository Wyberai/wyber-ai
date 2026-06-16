import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Connectors — WyberAi', description: 'Connect your app to 35+ services. Airtable, Notion, HubSpot, Stripe, Slack, Anthropic, and more.' };
const CONNECTORS = [
  { name:'Airtable', icon:'⬡', color:'#F59E0B', cat:'Data' },
  { name:'Notion', icon:'◈', color:'#374151', cat:'Data' },
  { name:'Supabase', icon:'⚡', color:'#3ECF8E', cat:'Data' },
  { name:'BigQuery', icon:'◉', color:'#4285F4', cat:'Data' },
  { name:'Snowflake', icon:'❄', color:'#29B5E8', cat:'Data' },
  { name:'MongoDB', icon:'🍃', color:'#00ED64', cat:'Data' },
  { name:'Contentful', icon:'◫', color:'#2478CC', cat:'CMS' },
  { name:'Storyblok', icon:'◧', color:'#00B3B0', cat:'CMS' },
  { name:'Sanity', icon:'◨', color:'#F03E2F', cat:'CMS' },
  { name:'HubSpot', icon:'◎', color:'#FF7A59', cat:'CRM' },
  { name:'Salesforce', icon:'☁', color:'#00A1E0', cat:'CRM' },
  { name:'Pipedrive', icon:'◑', color:'#1A73E8', cat:'CRM' },
  { name:'Slack', icon:'⬢', color:'#4A154B', cat:'Comms' },
  { name:'Resend', icon:'✉', color:'#0EA5E9', cat:'Comms' },
  { name:'Mailgun', icon:'📬', color:'#F06B0E', cat:'Comms' },
  { name:'Brevo', icon:'◆', color:'#0092FF', cat:'Comms' },
  { name:'Twilio', icon:'📱', color:'#F22F46', cat:'Comms' },
  { name:'Discord', icon:'🎮', color:'#5865F2', cat:'Comms' },
  { name:'Stripe', icon:'💳', color:'#635BFF', cat:'Payments' },
  { name:'Paddle', icon:'🏓', color:'#0FA46A', cat:'Payments' },
  { name:'OpenAI', icon:'✦', color:'#10A37F', cat:'AI' },
  { name:'Anthropic', icon:'◎', color:'#D4A574', cat:'AI' },
  { name:'ElevenLabs', icon:'🎙', color:'#9333EA', cat:'AI' },
  { name:'Perplexity', icon:'🔎', color:'#20B2AA', cat:'AI' },
  { name:'Replicate', icon:'◈', color:'#374151', cat:'AI' },
  { name:'GitHub', icon:'⌥', color:'#24292E', cat:'Dev' },
  { name:'Linear', icon:'▲', color:'#5E6AD2', cat:'Dev' },
  { name:'Jira', icon:'◉', color:'#0052CC', cat:'Dev' },
  { name:'Vercel', icon:'▲', color:'#24292E', cat:'Dev' },
  { name:'Google Maps', icon:'📍', color:'#4285F4', cat:'Location' },
  { name:'Mapbox', icon:'🗺', color:'#4264FB', cat:'Location' },
  { name:'PostHog', icon:'🦔', color:'#F54E00', cat:'Analytics' },
  { name:'Mixpanel', icon:'📊', color:'#7856FF', cat:'Analytics' },
  { name:'Amplitude', icon:'📈', color:'#1B1B1B', cat:'Analytics' },
];
export default function ConnectorsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Integrations</div>
        <h1 className="wy-h2">Connect your <em>entire stack</em></h1>
        <p style={{ fontSize:15, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:8 }}>Add any connector inside the IDE in one click. Your API keys are encrypted and never exposed in generated code.</p>
        <p style={{ fontSize:13, color:'var(--text3)', marginBottom:40 }}>{CONNECTORS.length} connectors · more added weekly</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:8, marginBottom:48 }}>
          {CONNECTORS.map(c=>(
            <div key={c.name} className="wy-card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:['#24292E','#374151','#1B1B1B'].includes(c.color) ? 'var(--bg3)' : c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.01em' }}>{c.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{c.cat}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'28px 32px', borderRadius:16, background:'var(--sky3)', border:'1px solid rgba(14,165,233,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Need a connector we don't have?</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Request it on Discord and we'll add it within a week.</div>
          </div>
          <Link href="/signup" className="wy-btn-primary" style={{ whiteSpace:'nowrap' }}>Start building free →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
