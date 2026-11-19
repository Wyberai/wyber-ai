import { SectionNav } from './SectionNav'
import { DoorLink } from './DoorLink'
import { DoorVideo } from './DoorVideo'
import { DoorView } from './DoorView'
import { LaunchStrip, ExpoStrip } from '@/components/shared/LaunchStrip'
import { QuickPrompt } from './QuickPrompt'
import { Theatre } from './Theatre'
import { Tour } from './Tour'
import { Faq, FinalCta, Facts, Lanes, PricingBand, Section, TypeCards } from './sections'

/** The Signal homepage: one question, four doors, then the parts of the product nobody else has. */
export function SignalHome({ usd = false }: { usd?: boolean }) {
  return (
    <>
      <DoorView door="home" />
      <SectionNav />
      {!usd && <ExpoStrip />}
      <LaunchStrip />
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-q">
          <span className="sg-mono sg-eyebrow">The builder that shows its work</span>
          <h1 id="sg-q">What are you looking <span className="sg-em">to do?</span></h1>
          <p className="sg-lede">Pick one and we will show you the way.</p>
          <div className="sg-doors" role="group" aria-label="What are you looking to do?">
            <DoorLink className="sg-door" href="/solve" step="door_solve">
              <DoorVideo src="/signal/solve.mp4" poster="/signal/solve.jpg" />
              <span className="sg-go" aria-hidden="true">→</span>
              <span className="sg-meta">Chaos to calm</span>
              <h2>Solve a problem</h2>
              <p>Something in your business is slowing you down: orders, stock, follow-ups, paperwork, or a tool you pay for and barely use.</p>
            </DoorLink>
            <DoorLink className="sg-door" href="/create" step="door_create">
              <DoorVideo src="/signal/build.mp4" poster="/signal/build.jpg" />
              <span className="sg-go" aria-hidden="true">→</span>
              <span className="sg-meta">Built from nothing</span>
              <h2>Build apps</h2>
              <p>Got an idea? Describe it and see a working first version.</p>
            </DoorLink>
            <DoorLink className="sg-door" href="/agencies" step="door_agencies">
              <DoorVideo src="/signal/agencies.mp4" poster="/signal/agencies-poster.jpg" />
              <span className="sg-go" aria-hidden="true">→</span>
              <span className="sg-meta">Agency mode</span>
              <h2>Work for clients</h2>
              <p>Build for clients, get their approval, go live on their domain, and send the quote.</p>
            </DoorLink>
            <DoorLink className="sg-door" href="#watch" step="door_scroll">
              <DoorVideo src="/signal/explore.mp4" poster="/signal/explore.jpg" />
              <span className="sg-go" aria-hidden="true">↓</span>
              <span className="sg-meta">Everything it can do</span>
              <h2>Just scrolling</h2>
              <p>Look around first. See everything it can do. Nothing to fill in.</p>
            </DoorLink>
          </div>
          <QuickPrompt />
          <ul className="sg-proof" aria-label="What you get">
            <li><b>30 free credits</b><span>No card needed to start</span></li>
            <li><b>Security scan</b><span>Probed the moment you publish</span></li>
            <li><b>Self-healing builds</b><span>Errors are repaired during the build</span></li>
            <li><b>Code is yours</b><span>Push it to your own GitHub</span></li>
          </ul>
        </section>
      </div>

      <Section id="watch" label="Watch it work" title={<>Describe it. Watch it. <span className="sg-em">Own it.</span></>} sub="Pick a problem and watch a build happen. The cost, the repair and the security check are all on screen, because nothing is hidden.">
        <Theatre usd={usd} />
      </Section>
      <Section id="parts" label="More than a builder" title="The parts nobody else has"><Lanes /></Section>
      <Section id="kinds" label="What you can build" title="Four kinds of project, one place" sub="Describe it in plain English. WyberAi writes the code, sets up the database and logins, and gets it ready to publish."><TypeCards /></Section>
      <Section id="editor" label="Inside the editor" title="Keeps going after the first build"><p className="sg-sub" style={{ marginTop: 0 }}>Tap a tool to see it.</p><Tour usd={usd} /></Section>
      <Section id="trust" label="Built to be trusted" title="Why people stay with it"><Facts /></Section>
      <PricingBand />
      <Faq />
      <FinalCta />
    </>
  )
}
