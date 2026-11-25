import { DoorView } from '@/components/signal/DoorView'
import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { resolveRegion } from '@/lib/region'
import { AnswerHero } from '@/components/signal/AnswerHero'
import { Theatre } from '@/components/signal/Theatre'
import { Tour } from '@/components/signal/Tour'
import { Faq, FinalCta, PricingBand, Section, TypeCards } from '@/components/signal/sections'

export const metadata: Metadata = {
  title: 'Build an app, website or SaaS from a description',
  description: 'Describe your idea in plain English. WyberAi writes the code, sets up the database and logins, and gets it ready to publish.',
  alternates: { canonical: '/create' },
}

export default async function CreatePage() {
  const usd = (await resolveRegion()) !== 'INR'
  return (
    <SignalFrame>
      <DoorView door="create" />
      <div className="sg-wrap">
        <AnswerHero door="idea" eyebrow="Build apps" title={<>Describe it. See a working <span className="sg-em">first version.</span></>} lede="A web app, a mobile app, a website or a SaaS. Say what it is and who it is for." placeholder="Example: A booking app for my salon with reminders by WhatsApp." video="/signal/build.mp4" poster="/signal/build.jpg" alt="An app taking shape from nothing" />
      </div>
      <Section label="What you can build" title="Four kinds of project, one place"><TypeCards /></Section>
      <Section id="watch" label="Watch it work" title="A build, start to finish"><Theatre usd={usd} /></Section>
      <Section label="Inside the editor" title="Keeps going after the first build"><Tour usd={usd} /></Section>
      <PricingBand />
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
