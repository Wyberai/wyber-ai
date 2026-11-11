import Link from 'next/link'
import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { Faq, Facts, Section } from '@/components/signal/sections'
import { Theatre } from '@/components/signal/Theatre'
import { CalEmbed } from '@/components/consult/CalEmbed'
import { resolveRegion } from '@/lib/region'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'

export const metadata: Metadata = {
  title: 'Free app idea call: leave with a plan to build it',
  description: 'Book a free 30-minute call with the founder of WyberAi. Describe your app idea in plain English and get a written breakdown within 24 hours: what to build first, the tools it needs, and what it takes to build.',
  openGraph: {
    images: DEFAULT_OG_IMAGES,
    title: 'Free app idea call: leave with a plan to build it',
    description: '30 minutes with the founder. A written MVP plan within 24 hours. Free, no card, no obligation.',
  },
}

const CAL_LINK = 'https://cal.com/wyberai/wyber-ai-build-consultation'

// One substantial build for each kind of project, the size of work the Complex and Medium tiers below cover. Each is
// scoped on the call: we say what is realistic, and what we would cut from a first version.
const BIG_BUILDS: Array<{ kind: string; title: string; what: string; parts: string }> = [
  { kind: 'SaaS', title: 'A scheduling platform for teams', what: 'Think a booking product other businesses pay to use.', parts: 'Accounts and teams, availability, public booking pages, reminders, plans and billing, an admin view.' },
  { kind: 'Web app', title: 'A two-sided marketplace', what: 'Buyers on one side, sellers on the other, you in the middle.', parts: 'Listings, search, orders, seller dashboards, messaging, payments, a back office to run it.' },
  { kind: 'Mobile app', title: 'A booking or delivery app', what: 'A real phone app your customers install, with a web panel for you.', parts: 'Customer accounts, booking or ordering, live status, notifications, an admin panel for your team.' },
  { kind: 'Website', title: 'A business site that sells', what: 'A multi-page site that looks like you and takes orders or bookings.', parts: 'Pages, a catalogue or services list, checkout or booking, content you can change by asking.' },
]

const TIERS: Array<{ name: string; price: string; when: string; items: string[] }> = [
  { name: 'Simple build', price: '$199', when: '24 hours', items: ['Landing pages, portfolios, tools', 'GitHub repo and live URL', '7-day support'] },
  { name: 'Medium build', price: '$399', when: '3 working days', items: ['SaaS MVP with sign-in and a database', '3 to 6 screens, real user accounts', 'GitHub repo and live URL', '14-day support'] },
  { name: 'Complex build', price: '$799', when: '1 week', items: ['Full SaaS with payments and several roles', '6+ screens, integrations', 'GitHub repo and live URL', '30-day support'] },
]

const LEAVE_WITH = [
  ['Your MVP, scoped', 'The smallest version worth building first, and a clear list of what waits for later. A first idea is usually bigger than a first version needs to be, so we cut it down to the part that proves it works.'],
  ['The tools it needs', 'Logins, a database, payments, email and the other services your idea depends on, and which of them are ready to connect on WyberAi.'],
  ['A fixed price and a date', 'What it costs to build, the delivery date, and what is in and out of scope. In writing, within 24 hours, with no open-ended hours.'],
]

const HOW = [
  ['You describe it', 'No deck or brief needed. Say what it is, who it is for, and the problem it solves, in your own words.'],
  ['We ask what matters', 'What has to work on day one, what can wait, who your first ten users are, and what you can spend.'],
  ['You get it in writing', 'A breakdown by email within 24 hours, so you can decide at your own pace.'],
]

const FAQ: Array<[string, string]> = [
  ['Is the call really free?', 'Yes. No card, no payment and no sales script. The only ask is that you are seriously considering building something, because the call is with the founder personally.'],
  ['What exactly do I get after the call?', 'Within 24 hours, an email with the scoped MVP, the tools and integrations it needs, and a fixed quote with a delivery date.'],
  ['Do I have to have it all figured out?', 'No. Working out what to build first is most of the value. Come with a rough idea and we will make it concrete.'],
  ['Am I obliged to hire you afterwards?', 'No. The breakdown is yours. Take it to anyone, or come back when you are ready.'],
  ['How long does a build take?', 'It depends on the size: 24 hours for a simple build, 3 working days for a medium one, and about a week for a complex one. The quote states the date.'],
  ['What time zone are the slots in?', 'The calendar shows times in your own time zone. Calls are on Google Meet.'],
]

export default async function ConsultPage() {
  const usd = (await resolveRegion()) !== 'INR'

  return (
    <SignalFrame bare>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-cons">
          <span className="sg-mono sg-eyebrow">Free · 30 minutes · Google Meet</span>
          <h1 id="sg-cons">Have an app idea? <span className="sg-em">Leave with a plan to build it.</span></h1>
          <p className="sg-lede">Book 30 minutes with the founder of WyberAi. Tell me your idea in plain English, and within 24 hours you get a written breakdown: what to build first, the tools it needs, and what it takes to build.</p>
          <p style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="sg-btn" href="#book">Pick a time <span aria-hidden="true">↓</span></a>
            <a className="sg-btn sg-ghost" href="#build">See what we build</a>
          </p>
          <p className="sg-note" style={{ textAlign: 'left' }}>No card. No sales script. No obligation.</p>
        </section>
      </div>

      <Section id="build" label="What we build" title="Big builds, not just trackers" sub="One substantial example for each kind of project. On the call we shape yours, and tell you what is realistic for a first version and what we would cut.">
        <div className="sg-grid4">
          {BIG_BUILDS.map(x => (
            <div className="sg-card" key={x.title}>
              <span className="sg-mono sg-lbl">{x.kind}</span>
              <h3>{x.title}</h3>
              <p>{x.what}</p>
              <p style={{ marginTop: 8 }}><b>Typically:</b> {x.parts}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Every project includes" title="The parts that usually take weeks">
        <Facts items={[
          ['A live address', 'Publish in one click. Connect a domain you already own on a paid plan.'],
          ['Sign-in and a database', 'Accounts and a real database, set up for you rather than left as homework.'],
          ['68 connectors', 'Live connections to the tools you already use, each through its own sign-in.'],
          ['The code is yours', 'Push it to your own GitHub repository and take it anywhere.'],
        ]} />
      </Section>

      <Section label="Watch it work" title="A build, start to finish" sub="An illustration with sample data of how we build: an error repaired along the way, and the security check after publishing.">
        <Theatre usd={usd} />
      </Section>

      <Section label="What it costs" title="Fixed price, fixed date" sub="After the call you get a quote for the scope we agreed. These are the three sizes, the same as on the pricing page.">
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {TIERS.map(t => (
            <div className="sg-card" key={t.name}>
              <span className="sg-mono sg-lbl">{t.when}</span>
              <h3>{t.name}: {t.price}</h3>
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--sg-ink2)', fontSize: 15, lineHeight: 1.7 }}>{t.items.map(i => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="sg-note" style={{ marginTop: 20, textAlign: 'left' }}>
          Not sure which size your idea is? That is what the call is for. See the <Link className="sg-link" href="/complexity-guide">size guide</Link>, or <Link className="sg-link" href="/marketplace">browse 100+ finished apps</Link> built on WyberAi.
        </p>
      </Section>

      <Section id="book" label="Book" title="Pick a time" sub="Times show in your own time zone.">
        <div className="sg-island-dark" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--sg-line)' }}>
          <CalEmbed base={CAL_LINK} title="Book your free WyberAi founder call" />
        </div>
        <p className="sg-note" style={{ marginTop: 14, textAlign: 'left' }}>
          Calendar not loading? <a className="sg-link" href={CAL_LINK} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.
        </p>
      </Section>

      <Section label="What you leave with" title="Written down, so you can decide in your own time">
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {LEAVE_WITH.map(([t, d], i) => (
            <div className="sg-card" key={t}><span className="sg-mono sg-lbl">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </Section>

      <Section label="How the 30 minutes go" title="Plain, and about your idea">
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {HOW.map(([t, d], i) => (
            <div className="sg-card" key={t}><span className="sg-mono sg-lbl">Step {i + 1}</span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="sg-card"><h3>This is for you if</h3><p>You have an idea for an app, a website or a software product and have not started, or have started and stalled. You are not a developer, or you are one and want a second opinion on scope. You are seriously thinking about building it in the next few months.</p></div>
          <div className="sg-card"><h3>It is not for you if</h3><p>You want free development work: the call is about planning, and building is a separate step. Or you are only browsing: the call is with me personally, so please book it if you mean to act.</p></div>
        </div>
      </Section>

      <Section label="After the call" title="What happens next">
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="sg-card"><h3>We build it</h3><p>Say yes to the quote and we start. You get the GitHub repository, a live URL, a walkthrough, and support after delivery.</p><Link className="sg-link" href="/setup-call">How done-for-you works →</Link></div>
          <div className="sg-card"><h3>Or take the plan and go</h3><p>The breakdown is yours with no strings. Hand it to any developer or agency, or come back when you are ready.</p></div>
        </div>
      </Section>

      <Section label="Who you will talk to" title="The person who built it">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <img src="/sumeet-sutar.jpg" alt="Sumeet Sutar, founder of WyberAi" width={72} height={72} loading="lazy" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Sumeet Sutar</p>
            <p style={{ margin: '2px 0 0', color: 'var(--sg-ink2)' }}>Founder, WyberAi. You are not talking to a sales rep or a chatbot. You are talking to the person who built the product, and who will write up your plan afterwards.</p>
          </div>
        </div>
      </Section>

      <Faq items={FAQ} />

      <div className="sg-wrap">
        <section className="sg-sec sg-final">
          <h2>The worst case is 30 minutes and a clear answer.</h2>
          <p className="sg-sub">Either your idea is ready to build, or you find out what it needs first.</p>
          <p style={{ marginTop: 26 }}><a className="sg-btn" href="#book" style={{ padding: '15px 28px', fontSize: 16.5 }}>Book your free call <span aria-hidden="true">→</span></a></p>
          <p className="sg-note" style={{ marginTop: 28, textAlign: 'left' }}>
            <Link className="sg-link" href="/privacy">Privacy</Link> · <Link className="sg-link" href="/terms">Terms</Link> · <Link className="sg-link" href="/pricing">Pricing</Link>
          </p>
        </section>
      </div>
    </SignalFrame>
  )
}
