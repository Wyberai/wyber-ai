import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { AgencyDesk } from '@/components/signal/AgencyDesk'
import { Faq, FinalCta, Section } from '@/components/signal/sections'
import { QuickPrompt } from '@/components/signal/QuickPrompt'

export const metadata: Metadata = {
  title: 'Agency mode: deliver apps on a branded page',
  description: 'For freelancers: a brief form, one page per client to approve work, a quote they accept, and a handover. Fix their feedback with AI in one click.',
  alternates: { canonical: '/agencies' },
}

export default function AgenciesPage() {
  return (
    <SignalFrame>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-ag">
          <span className="sg-mono sg-eyebrow">Agency mode</span>
          <h1 id="sg-ag">A page for every client, <span className="sg-em">in their colours.</span></h1>
          <p className="sg-lede">Run a client job from start to finish. Send a short brief form, build from their answers, and show the work at one link where they approve it or ask for changes. Turn their feedback into edits with AI, hand the project over, and send a quote they accept with their name. You see when they open it, and you can lock the link or switch it off when the job ends.</p>
        </section>
      </div>
      <Section label="Try it" title="Set up a client page"><AgencyDesk /></Section>
      <Section label="Start" title="Build the first project"><QuickPrompt /></Section>
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
