import Link from 'next/link'
import { LIBRARY_TOOLS } from '@/lib/byos/slug'
import { HOME_STRINGS } from '@/lib/i18n/home-translations'

/** Sections shared by the Signal pages. Server components: they ship no JavaScript of their own. */

export function Section({ id, label, title, sub, children }: { id?: string; label?: string; title?: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="sg-wrap">
      <section id={id} className="sg-sec">
        {label && <span className="sg-mono sg-lbl">{label}</span>}
        {title && <h2>{title}</h2>}
        {sub && <p className="sg-sub">{sub}</p>}
        {children}
      </section>
    </div>
  )
}

const ICON = {
  app: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2.5" /><path d="M8 21h8M12 17v4" /></svg>,
  mobile: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>,
  website: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>,
  saas: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>,
}

export function TypeCards() {
  const items: [keyof typeof ICON, string, string, string][] = [
    ['app', 'Web apps', 'Type what you want in plain English. WyberAi generates production-ready React code, provisions a database, and deploys to a live URL, in minutes.', '/use-cases/no-code-web-app-builder'],
    ['mobile', 'Mobile apps', 'Generate a real React Native app with Expo. Preview on your phone via QR code. Export a ready-to-publish project.', '/use-cases/build-mobile-app-with-ai'],
    ['website', 'Websites', 'Landing pages, bookings and storefronts, changed by asking.', '/websites'],
    ['saas', 'SaaS products', 'Plans, sign-ups and billing, ready to sell.', '/use-cases/build-saas-without-code'],
  ]
  return (
    <div className="sg-grid4">
      {items.map(([k, h, p, href]) => (
        <Link key={h} href={href} className="sg-card sg-type">{ICON[k]}<h3>{h}</h3><p>{p}</p><span className="sg-link">Learn more →</span></Link>
      ))}
    </div>
  )
}

export function Lanes() {
  return (
    <>
      <div className="sg-lanes">
        <Link className="sg-lane" href="/byos"><em>{LIBRARY_TOOLS.length} tools analysed</em><h3>Replace your SaaS</h3><p>Pick the features of a tool you rent. We show what we build, what you must bring, and what we will not pretend to do. Then what you have been paying for features you never touch.</p><span className="sg-go2">Try it with Calendly, Mailchimp or HubSpot →</span></Link>
        <Link className="sg-lane" href="/agencies"><em>Agency mode</em><h3>The whole client job in one place</h3><p>Take a brief, build, share a private preview, get approval, connect their domain and send a quote. Your name and logo on their page.</p><span className="sg-go2">See how it works →</span></Link>
        <Link className="sg-lane" href="/tools"><em>No signup</em><h3>Free security and SEO scan</h3><p>A public check: probe a live database like an attacker would and audit any URL. The full in-editor scan costs credits.</p><span className="sg-go2">Scan an app →</span></Link>
        <Link className="sg-lane" href="/marketplace"><em>Marketplace</em><h3>Buy or sell ready-made apps</h3><p>Real apps built on WyberAi, priced by the seller. Every purchase drops a fully editable copy into your account.</p><span className="sg-go2">Browse the marketplace →</span></Link>
      </div>
      <div className="sg-builtfor"><span>Built for</span><Link href="/designers">Designers: Figma to code</Link><Link href="/marketers">Marketers: landing pages</Link><Link href="/ecommerce">Online sellers: margin, stock and orders</Link></div>
    </>
  )
}

export function Facts({ items }: { items?: [string, string][] }) {
  const list = items ?? [
    ['Fresh code every time', 'Every project is written from your description, not picked off a shelf.'],
    ['Self-healing builds', 'When a build hits an error, WyberAi tries to fix it before you see it.'],
    ['A security scan on publish', 'The moment you publish, the app’s database is probed like an attacker would, and anything exposed is flagged.'],
    ['You own the code', 'Push it to your own GitHub repository and take it anywhere.'],
  ]
  return <div className="sg-facts">{list.map(([h, p]) => <div className="sg-card" key={h}><h3>{h}</h3><p>{p}</p></div>)}</div>
}

export function PricingBand() {
  return (
    <div className="sg-wrap"><section className="sg-sec">
      <div className="sg-band"><div><h2>Start free.</h2><p>30 credits and no card. See the plans when you need more builds.</p></div><Link className="sg-btn" href="/pricing">See pricing <span aria-hidden="true">→</span></Link></div>
    </section></div>
  )
}

export function Faq({ items }: { items?: Array<[string, string]> } = {}) {
  const faqs = items ?? HOME_STRINGS.en.homeFaqs
  return (
    <Section id="faq" label="FAQ" title="Questions, answered">
      <div style={{ marginTop: 28 }}>
        {faqs.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }).replace(/</g, '\\u003c') }} />
    </Section>
  )
}

export function FinalCta({ children }: { children?: React.ReactNode }) {
  return (
    <div className="sg-wrap"><section className="sg-sec sg-final">
      <h2>{children ?? <>Describe it. Watch it. <span className="sg-em">Own it.</span></>}</h2>
      <p className="sg-sub">No credit card. 30 free credits on signup.</p>
      <p style={{ marginTop: 26 }}><Link className="sg-btn" href="/signup" style={{ padding: '15px 28px', fontSize: 16.5 }}>Start free <span aria-hidden="true">→</span></Link></p>
    </section></div>
  )
}
