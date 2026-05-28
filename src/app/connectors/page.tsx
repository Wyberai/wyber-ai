'use client';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connectors â€” Wyber AI',
  description: 'Connect your app to 35+ services. Airtable, Notion, HubSpot, Stripe, Slack, Anthropic, and more.',
};

const CONNECTORS = [
  { name: 'Airtable', icon: 'â¬¡', color: '#F59E0B', cat: 'Data' },
  { name: 'Notion', icon: 'â—ˆ', color: '#374151', cat: 'Data' },
  { name: 'Supabase', icon: 'âš¡', color: '#3ECF8E', cat: 'Data' },
  { name: 'BigQuery', icon: 'â—‰', color: '#4285F4', cat: 'Data' },
  { name: 'Snowflake', icon: 'â„', color: '#29B5E8', cat: 'Data' },
  { name: 'MongoDB', icon: 'ðŸƒ', color: '#00ED64', cat: 'Data' },
  { name: 'Contentful', icon: 'â—«', color: '#2478CC', cat: 'CMS' },
  { name: 'Storyblok', icon: 'â—§', color: '#00B3B0', cat: 'CMS' },
  { name: 'Sanity', icon: 'â—¨', color: '#F03E2F', cat: 'CMS' },
  { name: 'HubSpot', icon: 'â—Ž', color: '#FF7A59', cat: 'CRM' },
  { name: 'Salesforce', icon: 'â˜', color: '#00A1E0', cat: 'CRM' },
  { name: 'Pipedrive', icon: 'â—‘', color: '#1A73E8', cat: 'CRM' },
  { name: 'Slack', icon: 'â¬¢', color: '#4A154B', cat: 'Comms' },
  { name: 'Resend', icon: 'âœ‰', color: '#0EA5E9', cat: 'Comms' },
  { name: 'Mailgun', icon: 'ðŸ“¬', color: '#F06B0E', cat: 'Comms' },
  { name: 'Brevo', icon: 'â—†', color: '#0092FF', cat: 'Comms' },
  { name: 'Twilio', icon: 'ðŸ“±', color: '#F22F46', cat: 'Comms' },
  { name: 'Discord', icon: 'ðŸŽ®', color: '#5865F2', cat: 'Comms' },
  { name: 'Stripe', icon: 'ðŸ’³', color: '#635BFF', cat: 'Payments' },
  { name: 'Paddle', icon: 'ðŸ“', color: '#0FA46A', cat: 'Payments' },
  { name: 'OpenAI', icon: 'âœ¦', color: '#10A37F', cat: 'AI' },
  { name: 'Anthropic', icon: 'â—Ž', color: '#D4A574', cat: 'AI' },
  { name: 'ElevenLabs', icon: 'ðŸŽ™', color: '#9333EA', cat: 'AI' },
  { name: 'Perplexity', icon: 'ðŸ”Ž', color: '#20B2AA', cat: 'AI' },
  { name: 'Replicate', icon: 'â—ˆ', color: '#374151', cat: 'AI' },
  { name: 'GitHub', icon: 'âŒ¥', color: '#24292E', cat: 'Dev' },
  { name: 'Linear', icon: 'â–²', color: '#5E6AD2', cat: 'Dev' },
  { name: 'Jira', icon: 'â—‰', color: '#0052CC', cat: 'Dev' },
  { name: 'Vercel', icon: 'â–²', color: '#24292E', cat: 'Dev' },
  { name: 'Google Maps', icon: 'ðŸ“', color: '#4285F4', cat: 'Location' },
  { name: 'Mapbox', icon: 'ðŸ—º', color: '#4264FB', cat: 'Location' },
  { name: 'PostHog', icon: 'ðŸ¦”', color: '#F54E00', cat: 'Analytics' },
  { name: 'Mixpanel', icon: 'ðŸ“Š', color: '#7856FF', cat: 'Analytics' },
  { name: 'Amplitude', icon: 'ðŸ“ˆ', color: '#1B1B1B', cat: 'Analytics' },
];

const DARK_COLORS = ['#24292E', '#374151', '#1B1B1B'];

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
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 40 }}>{CONNECTORS.length} connectors Â· more added weekly</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginBottom: 48 }}>
          {CONNECTORS.map(c => (
            <div key={c.name} className="wy-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: DARK_COLORS.includes(c.color) ? 'var(--bg3)' : c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                {c.icon}
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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Need a connector we don't have?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Request it on Discord and we'll add it within a week.</div>
          </div>
          <Link href="/signup" className="wy-btn-primary" style={{ whiteSpace: 'nowrap' }}>Start building free â†’</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}