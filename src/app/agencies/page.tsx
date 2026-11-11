import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { AgencyDesk } from '@/components/signal/AgencyDesk'
import { Faq, FinalCta, Section } from '@/components/signal/sections'
import { QuickPrompt } from '@/components/signal/QuickPrompt'

export const metadata: Metadata = {
  title: 'Agency mode: deliver apps on a branded page',
  description: 'One page per client in their colours: they approve your work or ask for changes, you see when they open it, and your team shares the same clients.',
  alternates: { canonical: '/agencies' },
}

export default function AgenciesPage() {
  return (
    <SignalFrame>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-ag">
          <span className="sg-mono sg-eyebrow">Agency mode</span>
          <h1 id="sg-ag">A page for every client, <span className="sg-em">in their colours.</span></h1>
          <p className="sg-lede">Show clients what you built at one link. They approve it or ask for changes, you see when they open it, and your team shares the same list of clients. Lock the link with a passcode, and switch it off when the engagement ends.</p>
        </section>
      </div>
      <Section label="Try it" title="Set up a client page"><AgencyDesk /></Section>
      <Section label="Start" title="Build the first project"><QuickPrompt /></Section>
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
