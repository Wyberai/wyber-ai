'use client'
import { primaryBtn, ghostBtn, SKY } from './ui'

// What Clients is, in four lines, for someone who has never used it. Shown while there are no clients and no business
// profile. "Set up my agency" opens the guided setup; "Just exploring" hides this and shows the plain empty page.

const CARDS: Array<[string, string]> = [
  ['Their brief', 'Send one link. Your client answers a short list of questions, and you build from their answers.'],
  ['Build and preview', 'Build the site in WyberAi. Your client sees a live preview and leaves comments pinned to the page.'],
  ['Approval and quote', 'One page where they approve the work and accept your quote with their name.'],
  ['Domain and email', "Connect their domain, or buy one in their name, and set up business email for them."],
]

export function AgencyIntro({ onSetup, onSkip }: { onSetup: () => void; onSkip: () => void }) {
  return (
    <section aria-label="What Clients is for" style={{ background: '#0d141e', border: '1px solid #14202e', borderRadius: 16, padding: '28px 28px 24px', margin: '8px 0 24px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px' }}>Run client work from one place</h2>
      <p style={{ color: '#9aa8bb', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 640 }}>
        Clients is for freelancers and agencies who build for other people. Each client gets their own private page. Nothing here is visible to anyone but you, your team and that client.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, margin: '0 0 22px' }}>
        {CARDS.map(([title, text]) => (
          <div key={title} style={{ background: '#0a1018', border: '1px solid #14202e', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: SKY, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#c3cedc', lineHeight: 1.55 }}>{text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={onSetup} style={{ ...primaryBtn, padding: '10px 22px' }}>Set up my agency</button>
        <button type="button" onClick={onSkip} style={{ ...ghostBtn, padding: '9px 16px' }}>Just exploring</button>
        <span style={{ fontSize: 12, color: '#5d6d82' }}>Setup takes about two minutes.</span>
      </div>
    </section>
  )
}
