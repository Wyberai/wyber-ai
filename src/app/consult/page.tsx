import Link from 'next/link'
import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { Faq, Facts, Section, TypeCards } from '@/components/signal/sections'
import { Theatre } from '@/components/signal/Theatre'
import { CalEmbed } from '@/components/consult/CalEmbed'
import { resolveRegion } from '@/lib/region'
import { TOPICS } from '@/lib/signal/guide'
import { FREE_CREDITS } from '@/lib/signal/handoff'
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

// Four of the plan shapes the builder really starts from (the same ones the homepage plan sketch uses), so the examples
// here can never describe a screen the product does not make.
const EXAMPLE_TITLES = ['Booking and appointments manager', 'Invoice and payment tracker', 'Leads and follow-up tracker', 'Order and delivery tracker']

const LEAVE_WITH = [
  ['Your MVP, scoped', 'The smallest version worth building first, and a clear list of what waits for later. A first idea is usually bigger than a first version needs to be, so we cut it down to the part that proves it works.'],
  ['The tools it needs', 'Logins, a database, payments, email and the other services your idea depends on, and which of them are ready to connect on WyberAi.'],
  ['What it takes to build', 'The cost in WyberAi credits if you build it yourself, or a fixed quote if you would rather we build it. In writing, within 24 hours.'],
]

const HOW = [
  ['You describe it', 'No deck or brief needed. Say what it is, who it is for, and the problem it solves, in your own words.'],
  ['We ask what matters', 'What has to work on day one, what can wait, who your first ten users are, and what you can spend.'],
  ['You get it in writing', 'A breakdown by email within 24 hours, so you can decide at your own pace.'],
]

const FAQ: Array<[string, string]> = [
  ['Is the call really free?', 'Yes. No card, no payment and no sales script. The only ask is that you are seriously considering building something, because the call is with the founder personally.'],
  ['What exactly do I get after the call?', 'Within 24 hours, an email with the scoped MVP, the tools and integrations it needs, and what it takes to build: credits if you build it on WyberAi, or a fixed quote if you want us to build it.'],
  ['Do I have to have it all figured out?', 'No. Working out what to build first is most of the value. Come with a rough idea and we will make it concrete.'],
  ['Am I obliged to hire you afterwards?', 'No. Use the plan to build it yourself on WyberAi, hire someone else, or come back when you are ready.'],
  ['Can I build it myself instead?', `Yes, and many people do. A free account includes ${FREE_CREDITS} credits, which cover one small first build, and you see the cost of any larger build before it starts.`],
  ['What time zone are the slots in?', 'The calendar shows times in your own time zone. Calls are on Google Meet.'],
]

export default async function ConsultPage() {
  const usd = (await resolveRegion()) !== 'INR'
  const examples = EXAMPLE_TITLES.map(t => TOPICS.find(x => x.title === t)).filter((x): x is (typeof TOPICS)[number] => !!x)

  return (
    <SignalFrame bare>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-cons">
          <span className="sg-mono sg-eyebrow">Free · 30 minutes · Google Meet</span>
          <h1 id="sg-cons">Have an app idea? <span className="sg-em">Leave with a plan to build it.</span></h1>
          <p className="sg-lede">Book 30 minutes with the founder of WyberAi. Tell me your idea in plain English, and within 24 hours you get a written breakdown: what to build first, the tools it needs, and what it takes to build.</p>
          <p style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="sg-btn" href="#book">Pick a time <span aria-hidden="true">↓</span></a>
            <Link className="sg-btn sg-ghost" href="/create">Sketch it yourself first</Link>
          </p>
          <p className="sg-note" style={{ textAlign: 'left' }}>No card. No sales script. No obligation.</p>
        </section>
      </div>

      <Section label="What we build" title="Not just a plan. We build the thing." sub="Describe it in plain English. WyberAi writes the code, sets up the database and logins, and gets it ready to publish. You can use it yourself or have us build it for you.">
        <TypeCards />
      </Section>

      <Section label="Every project includes" title="The parts that usually take weeks">
        <Facts items={[
          ['A live address', 'Publish in one click. Connect a domain you already own on a paid plan.'],
          ['Sign-in and a database', 'Accounts and a real database, set up for you rather than left as homework.'],
          ['68 connectors', 'Live connections to the tools you already use, each through its own sign-in.'],
          ['The code is yours', 'Push it to your own GitHub repository and take it anywhere.'],
        ]} />
      </Section>

      <Section label="Watch it work" title="A build, start to finish" sub="An illustration with sample data, so you can see what happens: what it costs, an error repaired for free, and the security check.">
        <Theatre usd={usd} />
      </Section>

      <Section label="Ideas like yours" title="What these usually start as" sub="Four plans the builder really starts from. On the call we shape one for your idea, with your words and your customers.">
        <div className="sg-grid4">
          {examples.map(x => (
            <div className="sg-card" key={x.title}>
              <span className="sg-mono sg-lbl">{x.kind}</span>
              <h3>{x.title}</h3>
              <p><b>Screens:</b> {x.screens.map(s => s[0]).join(', ')}.</p>
              <p style={{ marginTop: 8 }}><b>First win:</b> {x.win}</p>
            </div>
          ))}
        </div>
        <p className="sg-note" style={{ marginTop: 20, textAlign: 'left' }}>
          Want to see finished ones? <Link className="sg-link" href="/marketplace">Browse the marketplace</Link>, where 100+ ready-made apps built on WyberAi are listed.
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

      <Section label="After the call" title="Three ways forward">
        <div className="sg-grid4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="sg-card"><h3>Build it yourself</h3><p>Use the plan on WyberAi. {FREE_CREDITS} free credits cover a small first build.</p><Link className="sg-link" href="/signup">Start free →</Link></div>
          <div className="sg-card"><h3>Have us build it</h3><p>We send a fixed quote for the scope we agreed. No open-ended hours.</p><Link className="sg-link" href="/setup-call">How done-for-you works →</Link></div>
          <div className="sg-card"><h3>Take the plan elsewhere</h3><p>The breakdown is yours. Hand it to any developer or agency you like.</p></div>
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
