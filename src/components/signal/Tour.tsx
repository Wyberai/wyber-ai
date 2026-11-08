'use client'
import { useState } from 'react'

/** Six tools from the editor, each shown as a small picture of itself. Every one exists in the editor today. */

const HUB: [string, number, number][] = [['Slack', 15, 12], ['Teams', 85, 12], ['Salesforce', 6, 50], ['SAP', 94, 50], ['Workday', 15, 88], ['ServiceNow', 85, 88]]

const ITEMS: { name: string; blurb: string; view: () => React.ReactNode }[] = [
  { name: 'Visual editor', blurb: 'Click anything in the preview and change it.', view: () => (
    <div className="sg-mini">
      <div className="sg-mc sg-sel"><span className="sg-tb">Edit text · Colour · Remove</span><div className="sg-mono">Overdue invoices</div><div className="sg-mn">₹ 52,150</div></div>
      <div className="sg-mc"><div className="sg-mono">Paid this month</div><div className="sg-mn">₹ 1,84,000</div></div>
    </div>) },
  { name: 'Version history', blurb: 'Go back to any earlier version of your app.', view: () => (
    <div className="sg-mini"><ol className="sg-tl">
      {[['Today, 4:12 pm', 'Added payment reminders'], ['Today, 11:40 am', 'Changed the colours'], ['Yesterday', 'Added the customers page'], ['First build', 'Invoices and dashboard']].map(([a, b]) => (
        <li key={a}><b>{a}</b><span>{b}</span><span className="sg-mono" style={{ flex: 'none' }}>Restore</span></li>
      ))}
    </ol></div>) },
  { name: 'Payments', blurb: 'Add payments to your app with Stripe.', view: () => (
    <div className="sg-mini"><div className="sg-mc" style={{ display: 'grid', gap: 10 }}>
      <b>Pay invoice INV-1042</b>
      <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--sg-line)', color: 'var(--sg-ink3)', fontSize: 14 }}>Card number</div>
      <div style={{ padding: 12, borderRadius: 999, background: 'var(--sg-brand)', color: 'var(--sg-btn-ink)', textAlign: 'center', fontWeight: 600 }}>Pay ₹18,400</div>
      <span className="sg-mono">Stripe · test mode first</span>
    </div></div>) },
  { name: '68 connectors', blurb: 'Slack, Salesforce, SAP and more, with real sign-in.', view: () => (
    <div className="sg-mini"><div className="sg-hub"><div className="sg-c">Your app</div>
      {HUB.map(([n, x, y]) => <span key={n} className="sg-n" style={{ left: x + '%', top: y + '%' }}>{n}</span>)}
    </div></div>) },
  { name: 'Browser tests', blurb: 'Run your app in a real browser before you publish.', view: () => (
    <div className="sg-mini"><ul className="sg-chk">
      <li className="sg-y">Sign-in works<b>PASS</b></li><li className="sg-y">Add an invoice<b>PASS</b></li><li className="sg-n">Phone layout<b>FAIL</b></li><li className="sg-y">Phone layout, repaired<b>PASS</b></li>
    </ul></div>) },
  { name: 'SEO audit', blurb: 'Check titles, descriptions and structure first.', view: () => (
    <div className="sg-mini" style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
      <div className="sg-ring"><i>16/18</i></div>
      <ul className="sg-chk"><li className="sg-y">Every page has a title<b>PASS</b></li><li className="sg-y">Descriptions present<b>PASS</b></li><li className="sg-n">2 images missing alt text<b>FIX</b></li></ul>
    </div>) },
]

export function Tour() {
  const [i, setI] = useState(0)
  return (
    <div>
      <div className="sg-tour">
        <div className="sg-tabs-v" role="group" aria-label="Editor tools">
          {ITEMS.map((x, k) => (
            <button key={x.name} type="button" aria-pressed={k === i} onClick={() => setI(k)}><b>{x.name}</b><span>{x.blurb}</span></button>
          ))}
        </div>
        <div className="sg-tstage" aria-live="polite">{ITEMS[i].view()}</div>
      </div>
      <p className="sg-sub" style={{ marginTop: 16 }}>Also in the editor: Figma import, clone a page, a code editor, analytics, custom domains, and teams with single sign-on.</p>
    </div>
  )
}
