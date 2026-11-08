import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { AgencyDesk } from '@/components/signal/AgencyDesk'
import { Faq, FinalCta, Section } from '@/components/signal/sections'
import { QuickPrompt } from '@/components/signal/QuickPrompt'

export const metadata: Metadata = {
  title: 'Agency mode: deliver apps to clients on a branded page',
  description: 'Give each client a page in their colours that shows what you built for them. Switch it off when the engagement ends.',
  alternates: { canonical: '/agencies' },
}

export default function AgenciesPage() {
  return (
    <SignalFrame>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-ag">
          <span className="sg-mono sg-eyebrow">Agency mode</span>
          <h1 id="sg-ag">A page for every client, <span className="sg-em">in their colours.</span></h1>
          <p className="sg-lede">Show clients what you built for them at a link you can share. Only active clients can open it.</p>
        </section>
      </div>
      <Section label="Try it" title="Set up a client page"><AgencyDesk /></Section>
      <Section label="Start" title="Build the first project"><QuickPrompt /></Section>
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
