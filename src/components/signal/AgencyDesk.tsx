'use client'
import { useMemo, useState } from 'react'
import { readableOn } from '@/lib/color-contrast'

/**
 * A try-it-yourself version of the real client screen. Every control is a field in the real one, and the preview
 * follows the real client page: dark, the client's colour on the buttons, and a 404 unless the client is active.
 */

const COLORS = ['#0d9488', '#f97316', '#6366f1', '#e11d48', '#059669']
const STATUSES = ['lead', 'active', 'paused', 'archived'] as const
type Status = (typeof STATUSES)[number]
interface Del { n: string; h: string; d: string; on: boolean }

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'

export function AgencyDesk() {
  const [name, setName] = useState('Northwind Interiors')
  const [color, setColor] = useState(COLORS[0])
  const [intro, setIntro] = useState("Here's what we've built for you so far.")
  const [status, setStatus] = useState<Status>('active')
  const [dels, setDels] = useState<Del[]>([
    { n: 'Booking portal', h: '', d: 'Clients book site visits online.', on: true },
    { n: 'Order tracker', h: '', d: 'Every order and its delivery status.', on: true },
    { n: 'Marketing site', h: '', d: 'The public site, in your colours.', on: false },
  ])
  const [copied, setCopied] = useState(false)
  const slug = useMemo(() => slugify(name), [name])
  const ink = readableOn(color)
  const visible = dels.filter(d => d.on)
  const patch = (i: number, p: Partial<Del>) => setDels(a => a.map((d, k) => (k === i ? { ...d, ...p } : d)))

  return (
    <div className="sg-cdesk">
      <div className="sg-cform">
        <div><label className="sg-lb" htmlFor="sg-agn">Client or company name</label><input id="sg-agn" className="sg-field" value={name} onChange={e => setName(e.target.value)} /></div>
        <div>
          <span className="sg-lb">Brand colour</span>
          <div className="sg-swatches" role="group" aria-label="Brand colour">
            {COLORS.map(c => <button key={c} type="button" aria-pressed={c === color} style={{ background: c }} aria-label={'Colour ' + c} onClick={() => setColor(c)} />)}
          </div>
        </div>
        <div><label className="sg-lb" htmlFor="sg-agi">Intro</label><textarea id="sg-agi" className="sg-field" rows={2} value={intro} onChange={e => setIntro(e.target.value)} /></div>
        <div>
          <span className="sg-lb">Deliverables (the projects you show)</span>
          <div className="sg-dels">
            {dels.map((d, i) => (
              <div className="sg-d" key={d.n}>
                <input type="checkbox" checked={d.on} onChange={e => patch(i, { on: e.target.checked })} aria-label={'Show ' + d.n} />
                <span className="sg-dn">{d.n}</span>
                <input className="sg-field" type="text" value={d.h} onChange={e => patch(i, { h: e.target.value })} placeholder="Custom headline (optional)" aria-label={'Custom headline for ' + d.n} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="sg-lb" htmlFor="sg-ags">Status</label>
          <select id="sg-ags" className="sg-field" value={status} onChange={e => setStatus(e.target.value as Status)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          <p className="sg-note" style={{ textAlign: 'left', minHeight: 0 }}>Only active clients have a page. Paused and archived ones return a 404, so an old link stops working when the engagement ends.</p>
        </div>
        <button type="button" className="sg-btn sg-ghost" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
      <div className="sg-cprev" aria-live="polite">
        <div className="sg-url"><i /><i /><i /><span>wyberai.com/client/{slug}</span></div>
        {status !== 'active'
          ? <div className="sg-nf"><b>404</b>This page could not be found.</div>
          : <>
              <nav><span className="sg-lg" style={{ background: color, color: ink }}>{(name[0] || 'C').toUpperCase()}</span><b>{name || 'Client'}</b></nav>
              <div className="sg-in"><h4>{name || 'Client'}</h4><p>{intro}</p></div>
              <div className="sg-cards">
                {visible.length === 0 ? <p>Nothing is shown yet. Turn a deliverable on.</p> : visible.map(d => (
                  <div className="sg-c" key={d.n}>
                    <span className="sg-th2" style={{ background: `linear-gradient(135deg, ${color}, #1a1a22)` }} />
                    <div><b>{d.h || d.n}</b><span>{d.d}</span></div>
                    <span className="sg-open" style={{ background: color, color: ink }}>Open</span>
                  </div>
                ))}
              </div>
            </>}
      </div>
    </div>
  )
}
