import Link from 'next/link';
import { Space_Grotesk, Manrope } from 'next/font/google';
import ChatWidget from './ChatWidget';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-body' });

const CAL_LINK = 'https://cal.com/wyberai/wyberai-dentist-transformation-call';
const DASHBOARD_LINK = '/app/dentist-ops-dashboard/index.html';

const AI_FEATURES = [
  {
    n: '01',
    title: 'AI front desk',
    body: 'Answers insurance, hours, and booking questions the moment someone lands on the site.',
    proof: { kind: 'chat', label: 'Try it — bottom right corner' },
  },
  {
    n: '02',
    title: 'No-show predictor',
    body: 'Scores every upcoming appointment for no-show risk and prompts a confirmation nudge before the seat goes empty.',
    proof: { kind: 'risk', label: 'Elena Devereux', value: 'High risk · 67%' },
  },
  {
    n: '03',
    title: 'Review reply assistant',
    body: 'Drafts a reply to every incoming review in the practice’s own voice. Owner approves or edits — nothing goes out unread.',
    proof: { kind: 'quote', label: '★★★★★ Priya N.', value: '"Thank you so much, Priya — we’re thrilled she had a great first visit!"' },
  },
  {
    n: '04',
    title: 'Smart recall',
    body: 'Ranks overdue patients by how likely they are to actually rebook, instead of blasting the whole list on the same day every month.',
    proof: { kind: 'stat', label: 'This week', value: '12 patients auto-prioritized' },
  },
  {
    n: '05',
    title: 'AI copilot — ⌘J',
    body: 'Ask the dashboard a plain-English question and it answers from the practice’s own live data.',
    proof: { kind: 'ask', label: 'You ask', value: '"how many no-shows this week?"' },
  },
  {
    n: '06',
    title: 'Built to be found — SEO + AEO',
    body: 'Real technical SEO for Google, plus structured for AEO — the schema and clean answers that let ChatGPT, Perplexity, and Google AI Overviews actually recommend your practice.',
    proof: { kind: 'stat', label: '"best dentist near me"', value: 'Structured to be quotable, not just crawlable' },
  },
];

const AUTOMATIONS = [
  { title: 'Appointment reminders', desc: 'SMS + email, sent 24 hours before every visit, auto-scheduled off the calendar.' },
  { title: 'Recall batches', desc: 'Patients due for a 6-month cleaning get messaged automatically — no list-pulling.' },
  { title: 'Review requests', desc: 'Sent 2 hours after checkout, only to patients marked satisfied at the front desk.' },
  { title: 'Weekly owner report', desc: 'Requests, no-shows, revenue pace, and top lead source — delivered every Monday, no login required.' },
];

export const metadata = {
  title: 'Your Practice — 2026 Rebuild',
  description: 'A modern dental practice site with a real owner dashboard, AI front desk, and automations running behind it.',
};

export default function DentistOpsDemo() {
  return (
    <div className={`page ${spaceGrotesk.variable} ${manrope.variable}`}>
      {/* ---------- nav ---------- */}
      <header className="nav">
        <div className="wrap navwrap">
          <div className="mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3c-2.5 0-4 1.6-4 4 0 2.2.7 3.6 1.1 5.4.3 1.5.4 4.6 1.4 7.1.3.7 1.2.7 1.5 0 .5-1.3.6-2.7.9-3.9.1-.5.7-.5.8 0 .3 1.2.4 2.6.9 3.9.3.7 1.2.7 1.5 0 1-2.5 1.1-5.6 1.4-7.1.4-1.8 1.1-3.2 1.1-5.4 0-2.4-1.5-4-4-4-.7 0-1.3.2-1.8.5-.4-.3-1-.5-1.8-.5Z" />
            </svg>
            <span>Your Practice</span>
          </div>
          <nav className="navlinks">
            <span>Services</span>
            <span>About</span>
            <span>Reviews</span>
          </nav>
          <div className="navactions">
            <a href={DASHBOARD_LINK} className="btn btn-outline navDashBtn">
              Go to your dashboard →
            </a>
            <a className="btn btn-solid" href={CAL_LINK} target="_blank" rel="noopener">
              Book a free call
            </a>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="wrap heroInner">
          <div className="heroCopy">
            <div className="eyebrow">Live sample — this is a real, unlocked build</div>
            <h1>
              Still using an <span className="strike">outdated</span> website for your clinic?
            </h1>
            <p className="lede">
              Turn it from just a front end into a complete dashboard — tracking the metrics that
              matter to you, running the follow-ups you don&rsquo;t have time for, and staying with
              you as your practice grows.
            </p>
            <div className="heroActions">
              <a className="btn btn-solid btn-lg" href={CAL_LINK} target="_blank" rel="noopener">
                Book a free call with the founder →
              </a>
              <a className="btn btn-outline btn-lg" href="#behind">See what&rsquo;s behind it</a>
            </div>
          </div>

          <div className="compareStack">
            <div className="compareCard before">
              <div className="compareTag">Before</div>
              <div className="fauxBrowser">
                <div className="fauxBar"><span /><span /><span /></div>
                <div className="fauxBody">
                  <div className="fauxLine w60" />
                  <div className="fauxLine w40" />
                  <div className="fauxSpacer" />
                  <div className="fauxPhone">📞 (555) 214-0192</div>
                  <div className="fauxHint">Mon–Thu, 8am–4pm only</div>
                </div>
              </div>
            </div>
            <div className="compareCard after">
              <div className="compareTag">After</div>
              <div className="fauxBrowser dark">
                <div className="fauxBar"><span /><span /><span /></div>
                <div className="fauxBody">
                  <div className="fauxLine w70 light" />
                  <div className="fauxLine w50 light dim" />
                  <div className="fauxStatRow">
                    <div className="fauxStat"><b>23</b><small>Requests</small></div>
                    <div className="fauxStat"><b>4.2%</b><small>No-shows</small></div>
                    <div className="fauxStat"><b>$18.4k</b><small>Revenue</small></div>
                  </div>
                  <div className="fauxPing"><span className="pulseDot" />New request — 8:52am</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- transition ---------- */}
      <section id="behind" className="transition wrap">
        <h2>Most dental sites stop at a phone number.</h2>
        <p>This one has an owner dashboard, five AI features running quietly in the background, and a front-desk chatbot that never puts anyone on hold.</p>
      </section>

      {/* ---------- dashboard preview ---------- */}
      <section className="wrap">
        <div className="dashPreview">
          <div className="dashTop">
            <span>Owner dashboard — preview</span>
            <a href={DASHBOARD_LINK} className="tryLink">Open the real thing →</a>
          </div>
          <div className="dashGrid">
            <div className="stat"><div className="label">Appt. Requests — 7d</div><div className="value">23</div><div className="delta">↑ 41% vs last wk</div></div>
            <div className="stat"><div className="label">No-show Rate</div><div className="value">4.2%</div><div className="delta">↓ from 11.8%</div></div>
            <div className="stat"><div className="label">Reviews Requested</div><div className="value">31</div><div className="delta">19 responded</div></div>
            <div className="stat"><div className="label">Revenue — MTD</div><div className="value">$18.4k</div><div className="delta">6 days left</div></div>
          </div>
        </div>
      </section>

      {/* ---------- AI-native features ---------- */}
      <section className="wrap aiSection">
        <div className="sectionKicker"><span className="kickerLine" />AI-native, not bolted on</div>
        <h2 className="sectionHeadBig">Five things quietly doing the work of a front desk.</h2>
        <div className="aiGrid">
          {AI_FEATURES.map((f) => (
            <div className="aiCard" key={f.n}>
              <span className="aiNum">{f.n}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <div className={`aiProof proof-${f.proof.kind}`}>
                {f.proof.kind === 'chat' ? (
                  <span className="proofChat">💬 {f.proof.label}</span>
                ) : (
                  <>
                    <span className="proofLabel">{f.proof.label}</span>
                    <span className="proofValue">{f.proof.value}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- automations ---------- */}
      <section className="wrap">
        <h2 className="sectionHead">Running on their own — nobody at the desk touches these</h2>
        <div className="autoGrid">
          {AUTOMATIONS.map((a) => (
            <div className="autoCard" key={a.title}>
              <div className="autoTitle">{a.title}</div>
              <div className="autoDesc">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- shopify-style centered hard CTA ---------- */}
      <section className="midCta">
        <span className="freeTag">Free · 20 minutes · no obligation</span>
        <h2>Talk to the founder, not a sales team.</h2>
        <p>We&rsquo;ll pull up your actual site on the call and show you exactly what&rsquo;s missing.</p>
        <a className="btn btn-solid btn-xl" href={CAL_LINK} target="_blank" rel="noopener">
          Book your free call →
        </a>
      </section>

      {/* ---------- comparison ---------- */}
      <section className="wrap">
        <h2 className="sectionHead">What practices pay for today, split across two vendors</h2>
        <div className="compareTable">
          <div className="compareRow compareHead">
            <div>&nbsp;</div>
            <div>Template site vendor</div>
            <div>Patient comms add-on</div>
            <div>This</div>
          </div>
          <div className="compareRow"><div>Modern website</div><div>Yes</div><div>—</div><div>Yes</div></div>
          <div className="compareRow"><div>Owner dashboard</div><div>—</div><div>Sometimes</div><div>Yes</div></div>
          <div className="compareRow"><div>AI no-show / review / recall</div><div>—</div><div>Rarely</div><div>Yes</div></div>
          <div className="compareRow"><div>Typical monthly cost</div><div>Undisclosed, sales call</div><div>$189–$249+</div><div>One bill</div></div>
        </div>
        <p className="compareNote">RevenueWell and Weave pricing from their public 2026 rate cards — both are add-ons most practices layer on top of a separate website vendor, not a replacement for one.</p>
      </section>

      {/* ---------- bottom CTA ---------- */}
      <section className="wrap ctaBand">
        <div className="eyebrow">Not a mockup — this is the actual thing</div>
        <h2>If your site still only has a phone number on it, this is the other option.</h2>
        <p>Built directly by the founder — no agency, no account manager. If it&rsquo;s useful, your version can be running in about a week.</p>
        <div className="ctaButtons">
          <a className="btn btn-solid btn-lg" href={CAL_LINK} target="_blank" rel="noopener">Book your free call →</a>
          <a className="btn btn-outline btn-lg" href={DASHBOARD_LINK}>Go to your dashboard →</a>
        </div>
      </section>

      <footer className="footer wrap">
        <span>Sample build for outreach — practice name is a placeholder, no real patient data used.</span>
        <span>Built with <Link href="/">WyberAi</Link></span>
      </footer>

      <ChatWidget />

      <style>{`
        .page { --accent: #3B39E0; --accent-dark: #2C2AB8; --accent-soft: #EFEEFD; min-height: 100vh; background: #fff; color: #0a0a0a; font-family: var(--font-body), -apple-system, 'Segoe UI', sans-serif; overflow-x: clip; }
        .wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; position: relative; }
        .page h1, .page h2, .page h3 { font-family: var(--font-display), 'Arial Black', sans-serif; margin: 0; text-wrap: balance; letter-spacing: -0.01em; }
        .strike { position: relative; color: var(--accent); }
        .strike::after { content: ''; position: absolute; left: -2%; right: -2%; top: 48%; height: 4px; background: var(--accent); transform: rotate(-2deg); border-radius: 2px; }

        .nav { border-bottom: 1px solid #eaeaea; position: sticky; top: 0; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); z-index: 40; }
        .navwrap { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; gap: 16px; }
        .mark { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.05rem; font-family: var(--font-display), sans-serif; }
        .mark svg { width: 20px; height: 20px; }
        .navlinks { display: flex; align-items: center; gap: 26px; font-size: 0.86rem; color: #444; font-weight: 500; }
        .navactions { display: flex; align-items: center; gap: 10px; }
        .navDashBtn { font-weight: 700; }

        .btn { border-radius: 10px; padding: 11px 20px; font-size: 0.87rem; font-weight: 700; font-family: var(--font-body), sans-serif; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: transform 0.15s ease, box-shadow 0.15s ease; white-space: nowrap; }
        .btn:hover { transform: translateY(-1px); }
        .btn-solid { background: var(--accent); color: #fff; border: 2px solid var(--accent); box-shadow: 0 3px 0 var(--accent-dark); }
        .btn-solid:hover { box-shadow: 0 5px 0 var(--accent-dark); }
        .btn-outline { background: transparent; color: #0a0a0a; border: 2px solid #0a0a0a; }
        .btn-lg { padding: 15px 26px; font-size: 0.95rem; }
        .btn-xl { padding: 19px 38px; font-size: 1.1rem; border-radius: 12px; }

        .hero { padding: 64px 0 72px; border-bottom: 1px solid #eaeaea; }
        .heroInner { display: grid; grid-template-columns: 1fr; gap: 44px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 2px solid #0a0a0a; padding: 5px 12px; border-radius: 999px; margin-bottom: 22px; }
        .eyebrow::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--accent); display: inline-block; }
        .page h1 { font-size: clamp(2.3rem, 5.2vw, 4.1rem); font-weight: 700; line-height: 1.06; max-width: 16ch; }
        .lede { color: #444; font-size: 1.1rem; max-width: 56ch; margin: 22px 0 0; line-height: 1.6; font-weight: 500; }
        .heroActions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 30px; }

        .compareStack { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .compareCard { position: relative; }
        .compareTag { position: absolute; top: -12px; left: 16px; background: #fff; border: 2px solid #0a0a0a; padding: 2px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; z-index: 2; }
        .fauxBrowser { border: 2px solid #0a0a0a; border-radius: 14px; overflow: hidden; background: #fff; height: 100%; }
        .fauxBrowser.dark { background: #0a0a0a; }
        .fauxBar { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid #e5e5e5; }
        .fauxBrowser.dark .fauxBar { border-bottom-color: #2a2a2a; }
        .fauxBar span { width: 8px; height: 8px; border-radius: 50%; background: #ddd; }
        .fauxBrowser.dark .fauxBar span { background: #444; }
        .fauxBody { padding: 22px 20px 26px; }
        .fauxLine { height: 10px; border-radius: 5px; background: #e8e8e8; margin-bottom: 10px; }
        .fauxLine.light { background: #333; }
        .fauxLine.dim { opacity: 0.6; }
        .fauxLine.w60 { width: 62%; }
        .fauxLine.w40 { width: 40%; }
        .fauxLine.w70 { width: 72%; height: 13px; }
        .fauxLine.w50 { width: 50%; }
        .fauxSpacer { height: 28px; }
        .fauxPhone { font-size: 0.92rem; font-weight: 700; color: #555; }
        .fauxHint { font-size: 0.72rem; color: #999; margin-top: 6px; }
        .fauxStatRow { display: flex; gap: 14px; margin-top: 22px; }
        .fauxStat { color: #fff; }
        .fauxStat b { display: block; font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-size: 1.1rem; color: #7d7bf5; }
        .fauxStat small { color: #999; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .fauxPing { margin-top: 18px; display: inline-flex; align-items: center; gap: 7px; background: #1a1a1a; border: 1px solid #333; padding: 6px 10px; border-radius: 8px; font-size: 0.68rem; color: #ccc; font-family: 'JetBrains Mono', monospace; }
        .pulseDot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px var(--accent-dark); animation: pulse 1.8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }

        .transition { text-align: center; padding: 68px 0 8px; max-width: 640px; }
        .transition h2 { font-size: 1.7rem; font-weight: 700; }
        .transition p { color: #444; margin-top: 12px; font-size: 1rem; line-height: 1.6; font-weight: 500; }

        .dashPreview { margin: 40px auto 0; border: 2px solid #0a0a0a; border-radius: 16px; overflow: hidden; }
        .dashTop { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 2px solid #0a0a0a; font-size: 0.85rem; font-weight: 700; background: #fafafa; }
        .tryLink { font-weight: 700; text-decoration: underline; text-underline-offset: 3px; color: #0a0a0a; }
        .dashGrid { display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat { padding: 20px; border-right: 1px solid #eaeaea; }
        .stat:last-child { border-right: none; }
        .label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #777; font-weight: 700; }
        .value { font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-size: 1.6rem; font-weight: 700; margin-top: 6px; }
        .delta { font-size: 0.76rem; color: #444; margin-top: 4px; font-weight: 600; }

        .aiSection { padding-top: 88px; }
        .sectionKicker { display: flex; align-items: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; font-weight: 700; }
        .kickerLine { width: 24px; height: 2px; background: var(--accent); display: inline-block; }
        .sectionHeadBig { font-size: clamp(1.9rem, 3.4vw, 2.6rem); font-weight: 700; max-width: 18ch; margin-bottom: 40px; }
        .aiGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .aiCard { background: #fafafa; border: 2px solid #0a0a0a; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; transition: border-color 0.15s ease, transform 0.15s ease; }
        .aiCard:hover { border-color: var(--accent); transform: translateY(-2px); }
        .aiNum { font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--accent); display: block; margin-bottom: 14px; font-weight: 700; }
        .aiCard h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .aiCard p { font-size: 0.87rem; color: #555; line-height: 1.55; font-weight: 500; flex: 1; }
        .aiProof { margin-top: 16px; background: var(--accent-soft); border: 1px solid #e0defc; border-radius: 10px; padding: 10px 12px; font-size: 0.78rem; }
        .proofChat { font-weight: 700; color: var(--accent-dark); }
        .proofLabel { display: block; color: #7573c9; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; margin-bottom: 3px; }
        .proofValue { display: block; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; line-height: 1.4; color: var(--accent-dark); }
        .proof-quote .proofValue { font-family: var(--font-body), sans-serif; font-weight: 500; font-style: italic; }

        .sectionHead { font-family: var(--font-display), sans-serif; font-size: 1.55rem; font-weight: 700; margin: 72px 0 24px; }
        .autoGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .autoCard { background: #fafafa; border: 2px solid #0a0a0a; border-radius: 14px; padding: 22px; }
        .autoTitle { font-weight: 700; font-size: 0.97rem; margin-bottom: 6px; }
        .autoDesc { color: #555; font-size: 0.86rem; line-height: 1.55; font-weight: 500; }

        .midCta { background: #0a0a0a; color: #fff; padding: 96px 24px; text-align: center; margin-top: 96px; position: relative; overflow: hidden; }
        .midCta::before { content: ''; position: absolute; top: -40%; left: 50%; width: 700px; height: 700px; transform: translateX(-50%); background: radial-gradient(circle, var(--accent) 0%, transparent 65%); opacity: 0.25; pointer-events: none; }
        .freeTag { position: relative; display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: 2px solid var(--accent); color: #fff; background: rgba(59,57,224,0.25); padding: 6px 14px; border-radius: 999px; margin-bottom: 26px; }
        .midCta h2, .midCta p, .midCta .btn { position: relative; }
        .midCta h2 { color: #fff; font-size: clamp(2rem, 4.4vw, 3.2rem); font-weight: 700; max-width: 16ch; margin: 0 auto; }
        .midCta p { color: rgba(255,255,255,0.68); font-size: 1.05rem; margin: 18px auto 36px; max-width: 44ch; font-weight: 500; }
        .midCta .btn-solid { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 4px 0 var(--accent-dark); }
        .midCta .btn-solid:hover { box-shadow: 0 6px 0 var(--accent-dark); }

        .compareTable { border: 2px solid #0a0a0a; border-radius: 14px; overflow: hidden; margin-top: 4px; }
        .compareRow { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; font-size: 0.86rem; font-weight: 500; border-top: 1px solid #eaeaea; }
        .compareRow:first-child { border-top: none; }
        .compareRow > div { padding: 14px 16px; }
        .compareHead { font-weight: 700; background: #fafafa; }
        .compareRow > div:last-child { font-weight: 700; }
        .compareNote { font-size: 0.79rem; color: #777; margin-top: 12px; }

        .ctaBand { text-align: center; padding: 88px 0 64px; }
        .ctaBand h2 { font-size: clamp(1.8rem, 3.4vw, 2.4rem); max-width: 20ch; margin: 0 auto; font-weight: 700; }
        .ctaBand p { color: #444; max-width: 520px; margin: 18px auto 30px; font-size: 1rem; font-weight: 500; }
        .ctaButtons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        .footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 24px 24px 48px; font-size: 0.76rem; color: #999; border-top: 1px solid #eaeaea; font-weight: 500; }
        .footer a { color: #555; font-weight: 700; }

        @media (max-width: 860px) {
          .navlinks { display: none; }
          .compareStack { grid-template-columns: 1fr; }
          .dashGrid { grid-template-columns: repeat(2, 1fr); }
          .aiGrid { grid-template-columns: 1fr; }
          .autoGrid { grid-template-columns: 1fr; }
          .compareRow { grid-template-columns: 1.2fr 1fr 1fr 1fr; font-size: 0.74rem; }
          .navDashBtn span { display: none; }
        }
        @media (max-width: 520px) {
          .navDashBtn { padding: 10px 12px; }
        }
      `}</style>
    </div>
  );
}
