import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { resolveRegion } from '@/lib/region'
import { AnswerHero } from '@/components/signal/AnswerHero'
import { Theatre } from '@/components/signal/Theatre'
import { Faq, FinalCta, Facts, PricingBand, Section } from '@/components/signal/sections'

export const metadata: Metadata = {
  title: 'Solve a business problem with a custom app',
  description: 'Describe what is slowing your business down. WyberAi sketches the app that fixes it, then builds a working first version.',
  alternates: { canonical: '/solve' },
}

export default async function SolvePage() {
  const usd = (await resolveRegion()) !== 'INR'
  return (
    <SignalFrame>
      <div className="sg-wrap">
        <AnswerHero door="problem" eyebrow="Solve a problem" title={<>Tell us what is slowing you <span className="sg-em">down.</span></>} lede="Orders, stock, follow-ups, paperwork, a tool you pay for and barely use. Say it in your own words and we sketch the app that fixes it." placeholder="Example: I get 40 invoices a week on paper and have no idea who has paid." video="/signal/solve.mp4" poster="/signal/solve.jpg" alt="Loose paper and tools lining up into one tidy dashboard" />
      </div>
      <Section id="watch" label="Watch it work" title="From the mess to one screen" sub="A real build, with the cost and the security check on screen."><Theatre usd={usd} /></Section>
      <Section label="Built to be trusted" title="What you can rely on"><Facts /></Section>
      <PricingBand />
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
