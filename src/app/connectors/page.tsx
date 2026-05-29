import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connectors -- Wyber AI',
  description: 'Connect your app to 35+ services. Airtable, Notion, HubSpot, Stripe, Slack, Anthropic, and more.',
};

const CONNECTORS = [
  { name: 'Airtable', cat: 'Data', color: '#F59E0B' },
  { name: 'Notion', cat: 'Data', color: '#374151' },
  { name: 'Supabase', cat: 'Data', color: '#3ECF8E' },
  { name: 'BigQuery', cat: 'Data', color: '#4285F4' },
  { name: 'Snowflake', cat: 'Data', color: '#29B5E8' },
  { name: 'MongoDB', cat: 'Data', color: '#00ED64' },
  { name: 'Contentful', cat: 'CMS', color: '#2478CC' },
  { name: 'Storyblok', cat: 'CMS', color: '#00B3B0' },
  { name: 'Sanity', cat: 'CMS', color: '#F03E2F' },
  { name: 'HubSpot', cat: 'CRM', color: '#FF7A59' },
  { name: 'Salesforce', cat: 'CRM', color: '#00A1E0' },
  { name: 'Pipedrive', cat: 'CRM', color: '#1A73E8' },
  { name: 'Slack', cat: 'Comms', color: '#4A154B' },
  { name: 'Resend', cat: 'Comms', color: '#0EA5E9' },
  { name: 'Mailgun', cat: 'Comms', color: '#F06B0E' },
  { name: 'Brevo', cat: 'Comms', color: '#0092FF' },
  { name: 'Twilio', cat: 'Comms', color: '#F22F46' },
  { name: 'Discord', cat: 'Comms', color: '#5865F2' },
  { name: 'Stripe', cat: 'Payments', color: '#635BFF' },
  { name: 'Paddle', cat: 'Payments', color: '#0FA46A' },
  { name: 'OpenAI', cat: 'AI', color: '#10A37F' },
  { name: 'Anthropic', cat: 'AI', color: '#D4A574' },
  { name: 'ElevenLabs', cat: 'AI', color: '#9333EA' },
  { name: 'Perplexity', cat: 'AI', color: '#20B2AA' },
  { name: 'Replicate', cat: 'AI', color: '#374151' },
  { name: 'GitHub', cat: 'Dev', color: '#24292E' },
  { name: 'Linear', cat: 'Dev', color: '#5E6AD2' },
  { name: 'Jira', cat: 'Dev', color: '#0052CC' },
  { name: 'Vercel', cat: 'Dev', color: '#24292E' },
  { name: 'Google Maps', cat: 'Location', color: '#4285F4' },
  { name: 'Mapbox', cat: 'Location', color: '#4264FB' },
  { name: 'PostHog', cat: 'Analytics', color: '#F54E00' },
  { name: 'Mixpanel', cat: 'Analytics', color: '#7856FF' },
  { name: 'Amplitude', cat: 'Analytics', color: '#1B1B1B' },
];

const DARK = ['#24292E', '#374151', '#1B1B1B', '#4A154B'];

export default function ConnectorsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Integrations</div>
        <h1 className="wy-h2">Connect your <em>entire stack</em></h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, lineHeight: 1.75, marginBottom: 8 }}>
          Add any connector inside the IDE in one click. Your API keys are encrypted and never exposed in generated code.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 40 }}>{CONNECTORS.length} connectors available -- more added weekly</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginBottom: 48 }}>
          {CONNECTORS.map((c, i) => (
            <div key={i} className="wy-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: DARK.includes(c.color) ? 'var(--bg3)' : c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{c.cat}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '28px 32px', borderRadius: 16, background: 'var(--sky3)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Need a connector we do not have?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Request it on Discord and we will add it within a week.</div>
          </div>
          <Link href="/signup" className="wy-btn-primary" style={{ whiteSpace: 'nowrap' }}>Start building free</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}