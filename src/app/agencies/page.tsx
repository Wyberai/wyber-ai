import type { Metadata } from 'next'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { AgencyDesk } from '@/components/signal/AgencyDesk'
import { Faq, FinalCta, Section } from '@/components/signal/sections'
import { QuickPrompt } from '@/components/signal/QuickPrompt'
import { AgencyStart } from '@/components/signal/AgencyStart'

export const metadata: Metadata = {
  title: 'Agency mode: run the whole client job',
  description: 'For freelancers and agencies: brief form, build, client approval, your client\'s domain, a quote they accept, and a handover. Their feedback becomes edits.',
  alternates: { canonical: '/agencies' },
}

// Eight steps and four promises: even counts, so the grids never leave a short last row.
const STEPS: Array<[string, string]> = [
  ['Send a brief', 'A link with ten short questions. Their answers become your first build prompt, so you can skip the first call.'],
  ['Build it', 'Describe it, or build straight from their brief: a website, a web app or a mobile app.'],
  ['Show the work', 'One page per client, in their colours with your name on it. They approve it or ask for changes. No account needed.'],
  ['Fix their feedback', 'Change requests and pinned comments become a prompt in the builder. You read it and send it. Nothing is sent for you.'],
  ['Go live on their domain', 'Connect the domain your client already owns and get the DNS note for their IT person, or buy a new one in their name.'],
  ['Quote and get paid', 'Send a quote. They accept it with their name. You collect payment your own way, and mark it paid.'],
  ['Hand it over', 'Handover notes, the code, and a delivered state. Lock the page with a passcode when notes include private details.'],
  ['Keep it going', 'Monthly hosting or maintenance quotes, updates by email, and a record of every approval you can export.'],
]

const PROMISES: Array<[string, string]> = [
  ['Your clients stay yours', 'Each freelancer or agency only ever sees their own clients, projects, quotes and feedback. Other accounts cannot read, change or guess them.'],
  ['Private links', 'Long links nobody can guess, an optional passcode, and a new link that stops the old one working at once.'],
  ['Your name, not ours', 'Your logo and details show on the client page, quotes, invoices and emails. Replies go to you.'],
  ['Room for a team', 'Add teammates to a workspace. Admins manage, members edit, viewers can only look, and every sensitive change is logged.'],
]

export default function AgenciesPage() {
  return (
    <SignalFrame>
      <div className="sg-wrap">
        <section className="sg-question" aria-labelledby="sg-ag">
          <span className="sg-mono sg-eyebrow">Agency mode</span>
          <h1 id="sg-ag">Run the whole client job, <span className="sg-em">start to finish.</span></h1>
          <p className="sg-lede">For freelancers and agencies who build websites and apps for other people. From the first brief to the handover, in one place, with your name on it.</p>
          <p style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <AgencyStart className="sg-btn" href="/clients?welcome=1">Set up your client desk</AgencyStart>
            <a className="sg-btn sg-ghost" href="#sg-try">See what your client sees</a>
          </p>
        </section>
      </div>

      <Section label="The job" title="Everything between the brief and the invoice" sub="Each step is something freelancers do by hand today, across email, chat and spreadsheets.">
        <div className="sg-grid4">
          {STEPS.map(([title, body], i) => (
            <div className="sg-card" key={title}>
              <span className="sg-mono sg-lbl">Step {i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <p className="sg-note" style={{ marginTop: 20, textAlign: 'left' }}>
          Connecting a domain you already own needs a paid plan. A domain bought through WyberAi works on any plan and is billed to you, so add it to the quote.
        </p>
      </Section>

      <Section id="sg-try" label="Try it" title="Set up a client page"><AgencyDesk /></Section>

      <Section label="Built for more than one client" title="Separate, private and yours">
        <div className="sg-grid4">
          {PROMISES.map(([title, body]) => (
            <div className="sg-card" key={title}><h3>{title}</h3><p>{body}</p></div>
          ))}
        </div>
      </Section>

      <Section label="Start" title="Build the first project"><QuickPrompt /></Section>
      <Faq />
      <FinalCta />
    </SignalFrame>
  )
}
