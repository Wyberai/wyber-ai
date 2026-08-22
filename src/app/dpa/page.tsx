'use client';
import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';

export default function DpaPage() {
  const SECTIONS: [string, string][] = [
    ['Parties & scope', 'This Data Processing Addendum ("DPA") forms part of the agreement between SignalPulse Technologies LLC, doing business as WyberAi ("Processor"), and the customer using WyberAi under an Enterprise or Team plan ("Controller"), governing WyberAi\'s processing of personal data on the Controller\'s behalf. Where the Controller\'s own end users interact with an app built on WyberAi, the Controller is the data controller for that end-user data and WyberAi acts as a sub-processor.'],
    ['Subject matter & duration', 'WyberAi processes personal data solely to provide the WyberAi platform: account authentication, application hosting (WyberCloud databases), AI-assisted code generation, enterprise SSO, and related support. Processing continues for the duration of the Controller\'s subscription and for 30 days after account deletion, after which data is purged from active systems and backups.'],
    ['Categories of data & data subjects', 'Personal data processed includes: account holder name and email, SSO profile attributes (name, email, organization ID) received from the Controller\'s identity provider, project/application data the Controller or its users store in WyberAi, and usage metadata (build counts, credit consumption, timestamps). Data subjects are the Controller\'s authorized users and, where applicable, end users of applications the Controller builds and operates on WyberAi.'],
    ['Sub-processors', 'WyberAi engages the following sub-processors, each bound by its own data processing terms: Supabase (application database, hosted on AWS), Google Cloud (WyberCloud provisioned databases), WorkOS (enterprise SSO), Anthropic (AI code generation), OpenAI (in-app image generation), Vercel (application hosting/deployment), Dodo Payments (billing), Resend (transactional email). We will provide notice before adding or replacing a sub-processor material to this DPA; Controllers may object on reasonable data-protection grounds by contacting hello@wyberai.com.'],
    ['Security measures', 'Data at rest is encrypted. Row-Level Security (RLS) enforces per-tenant data isolation in the primary database, and every publish on the platform runs a live RLS trust scan — probing the production database with the same anonymous key an external party would use — before the release is allowed to go live. Access to production systems is limited to authorized personnel. Enterprise SSO (SAML/OIDC via WorkOS) is available so the Controller\'s own identity provider governs authentication and offboarding.'],
    ['International transfers', 'WyberAi and its sub-processors may process data in the United States. Where the Controller is subject to GDPR or a similar cross-border transfer regime, WyberAi will enter into Standard Contractual Clauses or an equivalent transfer mechanism with the Controller on request.'],
    ['Data subject rights', 'WyberAi will assist the Controller in responding to data subject requests (access, correction, deletion, portability) relating to data processed on the Controller\'s behalf, to the extent WyberAi is able to do so given the nature of the processing. Controllers can self-serve export of all project code at any time; account deletion is available in-product or by emailing hello@wyberai.com.'],
    ['Breach notification', 'WyberAi will notify the Controller without undue delay, and in any case within 72 hours of becoming aware, of a confirmed personal data breach affecting the Controller\'s data, including the nature of the breach and measures taken or proposed.'],
    ['Deletion on termination', 'Upon termination of the Controller\'s subscription, WyberAi will delete or return the Controller\'s personal data within 30 days, except where retention is required by law.'],
    ['Contact', 'For DPA questions, to request a countersigned copy, or to discuss Standard Contractual Clauses: hello@wyberai.com · SignalPulse Technologies LLC, Sheridan, Wyoming, USA.'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>Data Processing Addendum</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 56 }}>Last updated: August 2026 · WyberAi · wyberai.com</p>
        {SECTIONS.map(([title, body]) => (
          <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 10px' }}>{title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
