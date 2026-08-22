import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import { ConnectorLogo } from '@/components/shared/ConnectorLogo';
import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Connectors — WyberAi', description: 'Connect your app to 68 services with real OAuth — Salesforce, SAP, ServiceNow, Workday, Slack, Teams, and more — via Composio.' };
// `soon: true` entries have no Composio toolkit (verified against the live
// catalog) and have no real auth path yet — shown but not clickable, not
// counted in the "connectors" total below.
// `slug` is the Composio toolkit slug (verified against the live catalog) —
// used to pull the real brand logo from logos.composio.dev. Entries without
// one are `soon: true` and have no real logo source either.
const CONNECTORS = [
  { name:'Airtable', icon:'⬡', color:'#F59E0B', cat:'Data', slug:'airtable' },
  { name:'Notion', icon:'◈', color:'#374151', cat:'Data', slug:'notion' },
  { name:'Supabase', icon:'⚡', color:'#3ECF8E', cat:'Data', slug:'supabase' },
  { name:'BigQuery', icon:'◉', color:'#4285F4', cat:'Data', soon:true },
  { name:'Snowflake', icon:'❄', color:'#29B5E8', cat:'Data', slug:'snowflake' },
  { name:'Databricks', icon:'◆', color:'#FF3621', cat:'Data', slug:'databricks' },
  { name:'MongoDB', icon:'🍃', color:'#00ED64', cat:'Data', soon:true },
  { name:'Contentful', icon:'◫', color:'#2478CC', cat:'CMS', slug:'contentful' },
  { name:'Storyblok', icon:'◧', color:'#00B3B0', cat:'CMS', slug:'storyblok' },
  { name:'Sanity', icon:'◨', color:'#F03E2F', cat:'CMS', slug:'sanity' },
  { name:'HubSpot', icon:'◎', color:'#FF7A59', cat:'CRM', slug:'hubspot' },
  { name:'Salesforce', icon:'☁', color:'#00A1E0', cat:'CRM', slug:'salesforce' },
  { name:'Pipedrive', icon:'◑', color:'#1A73E8', cat:'CRM', slug:'pipedrive' },
  { name:'Dynamics 365', icon:'◈', color:'#0078D4', cat:'CRM', slug:'dynamics365' },
  { name:'Slack', icon:'⬢', color:'#4A154B', cat:'Comms', slug:'slack' },
  { name:'Resend', icon:'✉', color:'#0EA5E9', cat:'Comms', slug:'resend' },
  { name:'Mailgun', icon:'📬', color:'#F06B0E', cat:'Comms', soon:true },
  { name:'Brevo', icon:'◆', color:'#0092FF', cat:'Comms', slug:'brevo' },
  { name:'Twilio', icon:'📱', color:'#F22F46', cat:'Comms', soon:true },
  { name:'Discord', icon:'🎮', color:'#5865F2', cat:'Comms', slug:'discord' },
  { name:'Microsoft Teams', icon:'◫', color:'#6264A7', cat:'Comms', slug:'microsoft_teams' },
  { name:'Zoom', icon:'▣', color:'#2D8CFF', cat:'Comms', slug:'zoom' },
  { name:'Webex', icon:'◍', color:'#00BCEB', cat:'Comms', slug:'webex' },
  { name:'Gmail', icon:'✉', color:'#EA4335', cat:'Comms', slug:'gmail' },
  { name:'Outlook', icon:'✉', color:'#0078D4', cat:'Comms', slug:'outlook' },
  { name:'Google Calendar', icon:'◧', color:'#4285F4', cat:'Comms', slug:'googlecalendar' },
  { name:'Stripe', icon:'💳', color:'#635BFF', cat:'Payments', slug:'stripe' },
  { name:'Paddle', icon:'🏓', color:'#0FA46A', cat:'Payments', soon:true },
  { name:'QuickBooks', icon:'◔', color:'#2CA01C', cat:'Finance', slug:'quickbooks' },
  { name:'Xero', icon:'◑', color:'#13B5EA', cat:'Finance', slug:'xero' },
  { name:'NetSuite', icon:'◒', color:'#EA7600', cat:'Finance', slug:'netsuite' },
  { name:'OpenAI', icon:'✦', color:'#10A37F', cat:'AI', slug:'openai' },
  { name:'Anthropic', icon:'◎', color:'#D4A574', cat:'AI', soon:true },
  { name:'ElevenLabs', icon:'🎙', color:'#9333EA', cat:'AI', slug:'elevenlabs', url:'https://try.elevenlabs.io/si0z5cfaw6nq' },
  { name:'Perplexity', icon:'🔎', color:'#20B2AA', cat:'AI', soon:true },
  { name:'Replicate', icon:'◈', color:'#374151', cat:'AI', slug:'replicate' },
  { name:'GitHub', icon:'⌥', color:'#24292E', cat:'Dev', slug:'github' },
  { name:'GitLab', icon:'◆', color:'#FC6D26', cat:'Dev', slug:'gitlab' },
  { name:'Bitbucket', icon:'◇', color:'#0052CC', cat:'Dev', slug:'bitbucket' },
  { name:'Linear', icon:'▲', color:'#5E6AD2', cat:'Dev', slug:'linear' },
  { name:'Jira', icon:'◉', color:'#0052CC', cat:'Dev', slug:'jira' },
  { name:'Vercel', icon:'▲', color:'#24292E', cat:'Dev', slug:'vercel' },
  { name:'Datadog', icon:'◐', color:'#632CA6', cat:'Dev', slug:'datadog' },
  { name:'PagerDuty', icon:'◕', color:'#06AC38', cat:'Dev', slug:'pagerduty' },
  { name:'Google Maps', icon:'📍', color:'#4285F4', cat:'Location', slug:'google_maps' },
  { name:'Mapbox', icon:'🗺', color:'#4264FB', cat:'Location', slug:'mapbox' },
  { name:'PostHog', icon:'🦔', color:'#F54E00', cat:'Analytics', slug:'posthog' },
  { name:'Mixpanel', icon:'📊', color:'#7856FF', cat:'Analytics', slug:'mixpanel' },
  { name:'Amplitude', icon:'📈', color:'#1B1B1B', cat:'Analytics', slug:'amplitude' },
  { name:'Power BI', icon:'◫', color:'#F2C811', cat:'Analytics', slug:'microsoft_power_bi' },
  { name:'Segment', icon:'◈', color:'#52BD95', cat:'Analytics', slug:'segment' },
  { name:'ServiceNow', icon:'◉', color:'#62D84E', cat:'Support', slug:'servicenow' },
  { name:'Zendesk', icon:'◎', color:'#03363D', cat:'Support', slug:'zendesk' },
  { name:'Freshdesk', icon:'◍', color:'#25C16F', cat:'Support', slug:'freshdesk' },
  { name:'Freshservice', icon:'◍', color:'#25C16F', cat:'Support', slug:'freshservice' },
  { name:'Intercom', icon:'◐', color:'#1F45FF', cat:'Support', slug:'intercom' },
  { name:'Google Drive', icon:'◫', color:'#0F9D58', cat:'Docs', slug:'googledrive' },
  { name:'OneDrive', icon:'◫', color:'#0078D4', cat:'Docs', slug:'one_drive' },
  { name:'SharePoint', icon:'◧', color:'#038387', cat:'Docs', slug:'share_point' },
  { name:'Box', icon:'◻', color:'#0061D5', cat:'Docs', slug:'box' },
  { name:'Dropbox', icon:'◨', color:'#0061FF', cat:'Docs', slug:'dropbox' },
  { name:'Confluence', icon:'◬', color:'#2684FF', cat:'Docs', slug:'confluence' },
  { name:'DocuSign', icon:'✎', color:'#FFB600', cat:'Docs', slug:'docusign' },
  { name:'PandaDoc', icon:'✎', color:'#00B67A', cat:'Docs', slug:'pandadoc' },
  { name:'Asana', icon:'◑', color:'#F06A6A', cat:'PM', slug:'asana' },
  { name:'Monday.com', icon:'◔', color:'#FF3D57', cat:'PM', slug:'monday' },
  { name:'Trello', icon:'◫', color:'#0079BF', cat:'PM', slug:'trello' },
  { name:'ClickUp', icon:'◕', color:'#7B68EE', cat:'PM', slug:'clickup' },
  { name:'BambooHR', icon:'◍', color:'#73C41D', cat:'HR', slug:'bamboohr' },
  { name:'Greenhouse', icon:'◒', color:'#24A47F', cat:'HR', slug:'greenhouse' },
  { name:'Lever', icon:'◓', color:'#9AD03B', cat:'HR', slug:'lever' },
  { name:'Gusto', icon:'◔', color:'#F45D48', cat:'HR', slug:'gusto' },
  { name:'Workday', icon:'◕', color:'#F89904', cat:'HR', slug:'workday' },
  { name:'SAP SuccessFactors', icon:'◒', color:'#0070F2', cat:'HR', slug:'sap_successfactors' },
  { name:'Gong', icon:'◑', color:'#7B4FE3', cat:'Sales', slug:'gong' },
];
const LIVE_COUNT = CONNECTORS.filter(c => !c.soon).length;
export default function ConnectorsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Integrations</div>
        <h1 className="wy-h2">Connect your <em>entire stack</em></h1>
        <p style={{ fontSize:15, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:8 }}>Add any connector inside the IDE in one click. Your API keys are encrypted and never exposed in generated code.</p>
        <p style={{ fontSize:13, color:'var(--text3)', marginBottom:40 }}>{LIVE_COUNT} live connectors via real OAuth · {CONNECTORS.length - LIVE_COUNT} more coming soon</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:8, marginBottom:48 }}>
          {CONNECTORS.map(c=>{
            const inner = (
              <>
                <ConnectorLogo slug={c.slug} emoji={c.icon} color={c.color} name={c.name} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.01em' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{c.soon ? 'Coming soon' : c.cat}</div>
                </div>
              </>
            )
            const style = { padding:'14px 16px', display:'flex', alignItems:'center', gap:10, opacity: c.soon ? 0.5 : 1 } as const
            return (c as any).url
              ? <a key={c.name} href={(c as any).url} target="_blank" rel="noopener noreferrer" className="wy-card" style={{ ...style, textDecoration:'none', color:'inherit' }}>{inner}</a>
              : <div key={c.name} className="wy-card" style={style}>{inner}</div>
          })}
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
