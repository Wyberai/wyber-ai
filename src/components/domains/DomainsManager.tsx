'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import s from './DomainsManager.module.css'

// "Domains" screen, used inside the editor (projectId given: the bought domain is connected to that site) and on
// /dashboard/domains. Search, confirm (item, price, term, total, policy), pay, then watch the connection status.

type Quote = { domain: string; years: number; registryCents: number; marginCents: number; totalCents: number; renewalTotalCents: number | null }
type Result = { domain: string; tld: string; status: 'available' | 'taken' | 'unknown' | 'not_offered'; quote: Quote | null }
type Contact = { name: string; company: string; email: string; address1: string; city: string; state: string; zip: string; country: string; phoneCc: string; phone: string }
type Row = { domain: string; connection: 'dns_pending' | 'certificate_pending' | 'live' | 'needs_attention'; expires_at: string | null; daysLeft: number | null; project_id: string | null }
type Site = { id: string; name: string | null }
type WorkspaceRow = { domain: string; seats: number; expires_at: string | null; daysLeft: number | null; records: { records: { type: string; host: string; value: string; priority?: number }[]; written: boolean } | null }
type WsQuote = { seats: number; months: number; perSeatMonthCostCents: number; perSeatMonthMarginCents: number; registryCents: number; marginCents: number; totalCents: number }

const usd = (c: number) => `$${(c / 100).toFixed(2)}`
const EMPTY: Contact = { name: '', company: '', email: '', address1: '', city: '', state: '', zip: '', country: 'IN', phoneCc: '91', phone: '' }

const STATUS: Record<Row['connection'], { pill: string; cls: string; note: string; done: number }> = {
  dns_pending: { pill: 'DNS pending', cls: s.pillWait, note: 'The records are being written and can take a few minutes to spread.', done: 0 },
  certificate_pending: { pill: 'Certificate pending', cls: s.pillWait, note: 'DNS is right. The security certificate is being issued.', done: 1 },
  live: { pill: 'Live', cls: s.pillLive, note: 'Your domain is connected and serving your site.', done: 3 },
  needs_attention: { pill: 'Needs attention', cls: s.pillBad, note: 'A step did not finish. Press Try again.', done: 0 },
}
const STEP_LABELS = ['Records written', 'Certificate issued', 'Live']

const CONTACT_FIELDS: { k: keyof Contact; label: string; span2?: boolean; type?: string; auto?: string }[] = [
  { k: 'name', label: 'Full name', auto: 'name' },
  { k: 'company', label: 'Company (optional)', auto: 'organization' },
  { k: 'email', label: 'Email', span2: true, type: 'email', auto: 'email' },
  { k: 'phoneCc', label: 'Phone country code', auto: 'tel-country-code' },
  { k: 'phone', label: 'Phone number', type: 'tel', auto: 'tel-national' },
  { k: 'address1', label: 'Address', span2: true, auto: 'address-line1' },
  { k: 'city', label: 'City', auto: 'address-level2' },
  { k: 'state', label: 'State', auto: 'address-level1' },
  { k: 'zip', label: 'PIN or ZIP code', auto: 'postal-code' },
  { k: 'country', label: 'Country (2 letters, such as IN or US)', auto: 'country' },
]

function DomainName({ domain }: { domain: string }) {
  const i = domain.indexOf('.')
  return <span className={s.name}>{domain.slice(0, i)}<span>{domain.slice(i)}</span></span>
}

export default function DomainsManager({ projectId = null }: { projectId?: string | null }) {
  const [tab, setTab] = useState<'domains' | 'workspace' | 'mine'>('domains')
  const [q, setQ] = useState('')
  const [years, setYears] = useState(1)
  const [results, setResults] = useState<Result[] | null>(null)
  const [pick, setPick] = useState<Quote | null>(null)
  const [contact, setContact] = useState<Contact>(EMPTY)
  const [ack, setAck] = useState(false)
  const [policy, setPolicy] = useState<string[]>([])
  const [policyByTld, setPolicyByTld] = useState<Record<string, string[]>>({})
  const [sandbox, setSandbox] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  // Any message (an error from the payment step, a price change) must be seen, even when the person has scrolled down
  // to the Pay button: bring it into view whenever it appears.
  const msgRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [msg])
  const [mine, setMine] = useState<{ domains: Row[]; workspaces: WorkspaceRow[]; orders: { id: string; domain: string; status: string; error: string | null }[]; projects?: Site[]; workspaceEnabled?: boolean } | null>(null)
  const [wsDomain, setWsDomain] = useState('')
  const [seats, setSeats] = useState(3)
  const [wsQuote, setWsQuote] = useState<WsQuote | null>(null)
  const [wsPolicy, setWsPolicy] = useState<string[]>([])
  const [wsConfirm, setWsConfirm] = useState(false)
  const [alternatives, setAlternatives] = useState<Result[]>([])
  const [siteId, setSiteId] = useState('')
  const [track, setTrack] = useState<{ id: string; domain: string; kind: string; status: string } | null>(null)
  const [renew, setRenew] = useState<{ kind: 'domain' | 'workspace'; domain: string; term: number } | null>(null)
  const [rq, setRq] = useState<{ preview: { seats: number | null; term: number; registryCents: number; marginCents: number; totalCents: number; expiresAt: string; newExpiresAt: string }; policy: string[] } | null>(null)
  const [rAck, setRAck] = useState(false)

  const loadMine = useCallback(async () => {
    const r = await fetch('/api/domains/mine')
    if (r.ok) setMine(await r.json())
  }, [])
  useEffect(() => { loadMine() }, [loadMine])

  // The payment page sends people back with ?order=<id>. Show where that order is, and keep checking until it is done,
  // so nobody is left on a blank search screen wondering whether the payment worked.
  useEffect(() => {
    const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('order') : null
    if (!id) return
    let stop = false
    let tries = 0
    const tick = async () => {
      if (stop) return
      const r = await fetch(`/api/domains/order?id=${encodeURIComponent(id)}`).catch(() => null)
      if (r && r.ok) {
        const o = await r.json()
        setTrack(o)
        if (o.status === 'active' || o.status === 'needs_attention') { loadMine(); return }
      }
      if (++tries < 60) setTimeout(tick, 3000)
    }
    tick()
    return () => { stop = true }
  }, [loadMine])

  function leaveTrack() {
    setTrack(null)
    try { const u = new URL(window.location.href); u.searchParams.delete('order'); window.history.replaceState({}, '', u.toString()) } catch { /* not important */ }
    setTab('mine'); loadMine()
  }

  async function search() {
    setBusy(true); setMsg(''); setPick(null); setAck(false)
    const r = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}&years=${years}`)
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setMsg(j.error || 'Search failed')
    setResults(j.results); setAlternatives(j.alternatives ?? []); setSandbox(j.sandbox); setPolicyByTld(j.policyByTld ?? {})
  }

  // ── Renew ──
  async function loadRenewQuote(kind: 'domain' | 'workspace', domain: string, term: number) {
    setRq(null)
    const r = await fetch(`/api/domains/renew?kind=${kind}&domain=${encodeURIComponent(domain)}&${kind === 'domain' ? 'years' : 'months'}=${term}`)
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setRenew(null); setMsg(j.error || 'Could not price this renewal'); return }
    setRq({ preview: j.preview, policy: j.policy }); if (j.sandbox) setSandbox(true)
  }
  function openRenew(kind: 'domain' | 'workspace', domain: string) {
    if (renew?.domain === domain && renew.kind === kind) { setRenew(null); return }
    const term = kind === 'domain' ? 1 : 12
    setMsg(''); setRAck(false); setRenew({ kind, domain, term }); loadRenewQuote(kind, domain, term)
  }
  async function payRenew() {
    if (!renew || !rq) return
    setBusy(true); setMsg('')
    const body = { kind: renew.kind, domain: renew.domain, years: renew.term, months: renew.term, confirmedTotalCents: rq.preview.totalCents, acknowledged: rAck }
    const r = await fetch('/api/domains/renew', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (r.status === 409) { setBusy(false); setMsg(`The price changed to ${usd(j.totalCents)}. Open Renew again to see it.`); setRenew(null); return }
    if (!r.ok) { setBusy(false); return setMsg(j.error || 'Could not start the renewal') }
    if (j.sandbox) {
      await fetch('/api/domains/sandbox-pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: j.orderId }) })
      setBusy(false); setRenew(null); setMsg('Sandbox renewal complete. No money was taken.'); loadMine(); return
    }
    window.location.href = j.url
  }
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const renewPanel = (kind: 'domain' | 'workspace', domain: string) => renew?.kind === kind && renew.domain === domain && (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Renew {domain}</h3>
      {!rq && <p className={s.cardHint}>Getting the price</p>}
      {rq && (
        <>
          {kind === 'domain' ? (
            <div className={s.field} style={{ maxWidth: 220 }}>
              <label htmlFor={`rn-${domain}`}>Renew for</label>
              <select id={`rn-${domain}`} className={s.input} value={renew.term} onChange={e => { const t = Number(e.target.value); setRenew({ ...renew, term: t }); setRAck(false); loadRenewQuote(kind, domain, t) }}>
                {[1, 2, 3, 5, 10].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          ) : <p className={s.cardHint}>{rq.preview.seats} seats, {rq.preview.term} months. Renewing keeps the same seats.</p>}
          <table className={s.summary}><tbody>
            <tr><td className={s.label}>Now ends</td><td>{dateOf(rq.preview.expiresAt)}</td></tr>
            <tr><td className={s.label}>After renewing</td><td><strong>{dateOf(rq.preview.newExpiresAt)}</strong></td></tr>
            <tr><td className={s.label}>{kind === 'domain' ? 'Registry renewal price' : 'Google Workspace price'}</td><td>{usd(rq.preview.registryCents)}</td></tr>
            <tr><td className={s.label}>Our fee</td><td>{usd(rq.preview.marginCents)}</td></tr>
            <tr className={s.total}><td className={s.label}>Total</td><td>{usd(rq.preview.totalCents)}</td></tr>
          </tbody></table>
          <ul className={s.policy}>{rq.policy.map(l => <li key={l}>{l}</li>)}</ul>
          <label className={s.ack}><input type="checkbox" checked={rAck} onChange={e => setRAck(e.target.checked)} /><span>I have read this and want to renew {domain} for {usd(rq.preview.totalCents)}.</span></label>
          <div className={s.actions}>
            <button className={s.btn} disabled={!rAck || busy} onClick={payRenew}>{sandbox ? 'Renew in sandbox' : `Pay ${usd(rq.preview.totalCents)}`}</button>
            <button className={s.ghost} onClick={() => setRenew(null)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  )

  async function attachSite(domain: string, project: string) {
    if (!project) return
    await fetch('/api/domains/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain, projectId: project }) })
    loadMine()
  }

  function choose(res: Result) {
    if (!res.quote) return
    setPick(res.quote); setAck(false)
    setPolicy(policyByTld[res.tld] ?? [])
  }

  async function pay(kind: 'domain' | 'workspace') {
    setBusy(true); setMsg('')
    const body = kind === 'domain'
      ? { domain: pick!.domain, years: pick!.years, projectId: projectId ?? (siteId || null), contact, confirmedTotalCents: pick!.totalCents, acknowledged: ack }
      : { domain: wsDomain, seats, months: 12, contact, confirmedTotalCents: wsQuote!.totalCents, acknowledged: ack }
    const r = await fetch(kind === 'domain' ? '/api/domains/checkout' : '/api/workspace/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (r.status === 409) { setBusy(false); setMsg(`The price changed to ${usd(j.totalCents)}. Search again to see it.`); return }
    if (!r.ok) { setBusy(false); return setMsg(j.error || 'Could not start checkout') }
    if (j.sandbox) {
      await fetch('/api/domains/sandbox-pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: j.orderId }) })
      setBusy(false); setMsg('Sandbox purchase complete. No money was taken.'); setTab('mine'); loadMine(); return
    }
    window.location.href = j.url
  }

  async function wsPreview() {
    setBusy(true); setMsg('')
    const r = await fetch(`/api/workspace/quote?seats=${seats}&country=${contact.country}&domain=${encodeURIComponent(wsDomain || 'yourdomain.com')}`)
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setMsg(j.error || 'Could not price this')
    if (!j.quote) return setMsg('Workspace pricing is not available yet')
    setWsQuote(j.quote); setWsPolicy(j.policy); setWsConfirm(false); setAck(false)
  }

  async function retry(domain: string) {
    await fetch('/api/domains/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain }) })
    loadMine()
  }

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => setContact(c => ({ ...c, [k]: e.target.value }))
  const registrant = (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Who owns the domain</h3>
      <p className={s.cardHint}>The registrant is the legal owner of the domain. Use the real owner&apos;s details.</p>
      <div className={s.fields}>
        {CONTACT_FIELDS.map(f => (
          <div key={f.k} className={`${s.field} ${f.span2 ? s.span2 : ''}`}>
            <label htmlFor={`dm-${f.k}`}>{f.label}</label>
            <input id={`dm-${f.k}`} className={s.input} type={f.type ?? 'text'} autoComplete={f.auto} value={contact[f.k]} onChange={set(f.k)} />
          </div>
        ))}
      </div>
    </div>
  )

  const available = results ? [...results].sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available')) : null

  return (
    <div className={s.root}>
      <div className={s.tabs} role="tablist">
        {(['domains', 'workspace', 'mine'] as const).filter(t => t !== 'workspace' || mine?.workspaceEnabled).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => { setTab(t); setMsg(''); if (t === 'mine') loadMine() }}>
            {t === 'domains' ? 'Buy a domain' : t === 'workspace' ? 'Google Workspace' : 'My domains'}
          </button>
        ))}
      </div>
      {track && (
        <div className={`${s.track} ${track.status === 'needs_attention' ? s.trackBad : track.status === 'active' ? s.trackDone : ''}`} role="status" aria-live="polite">
          <div>
            <div className={s.trackTitle}>
              {track.status === 'awaiting_payment' && 'Waiting for your payment to be confirmed'}
              {track.status === 'registering' && (track.kind === 'workspace' ? `Setting up Google Workspace on ${track.domain}` : track.kind.endsWith('_renewal') ? `Renewing ${track.domain}` : `Registering ${track.domain}`)}
              {track.status === 'active' && (track.kind === 'workspace' ? `Google Workspace is set up on ${track.domain}` : track.kind.endsWith('_renewal') ? `${track.domain} is renewed` : `${track.domain} is yours`)}
              {track.status === 'needs_attention' && `Your payment for ${track.domain} is safe`}
              {track.status === 'cancelled' && 'This order was cancelled'}
            </div>
            <div className={s.meta}>
              {(track.status === 'awaiting_payment' || track.status === 'registering') && 'This can take a minute. You can leave this page: we email you when it is ready.'}
              {track.status === 'active' && (track.kind === 'workspace' ? 'We have emailed you what happens next.' : track.kind.endsWith('_renewal') ? 'The new date is on My domains. We have emailed you.' : 'It is being connected to your site now. We have emailed you the details.')}
              {track.status === 'needs_attention' && 'One step did not finish on its own. We have been told and will complete the order or refund you. We have emailed you.'}
            </div>
          </div>
          {(track.status === 'active' || track.status === 'needs_attention') && <button className={s.ghost} onClick={leaveTrack}>See my domains</button>}
        </div>
      )}
      {sandbox && <div className={`${s.notice} ${s.noticeWarn}`}><span className={s.dot} />Sandbox mode: prices are examples and nothing is charged or registered.</div>}
      {msg && <div ref={msgRef} role="alert" className={`${s.notice} ${s.noticeBad}`}><span className={s.dot} />{msg}</div>}

      {tab === 'domains' && (
        <>
          <p className={s.lead}>Our price is the registry price plus a <strong>flat $1</strong>, and the same $1 when you renew. Type your business name and see every extension at once.</p>
          <div className={s.searchRow}>
            <div className={s.searchField}>
              <input className={s.big} placeholder="ashabakery" aria-label="Domain name" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && q.trim().length >= 2 && search()} />
            </div>
            <select className={s.select} aria-label="Years" value={years} onChange={e => setYears(Number(e.target.value))}>{[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}</select>
            <button className={`${s.btn} ${s.btnSearch}`} disabled={busy || q.trim().length < 2} onClick={search}>{busy && !pick ? 'Searching' : 'Search'}</button>
          </div>

          {available && !pick && (
            <ul className={s.results}>
              {available.map(r => (
                <li key={r.domain} className={`${s.result} ${r.status === 'available' ? '' : s.resultMuted}`}>
                  <DomainName domain={r.domain} />
                  {r.status === 'available' && r.quote ? (
                    <span className={s.resultRight}>
                      <span className={s.price}>
                        <div className={s.priceTotal}>{usd(r.quote.totalCents)}</div>
                        <div className={s.priceNote}>{usd(r.quote.registryCents)} + $1 fee, per year</div>
                      </span>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => choose(r)}>Select</button>
                    </span>
                  ) : <span className={s.state}>{r.status === 'taken' ? 'Taken' : r.status === 'not_offered' ? 'Not offered yet' : 'Could not check, try again'}</span>}
                </li>
              ))}
            </ul>
          )}

          {alternatives.length > 0 && !pick && (
            <>
              <p className={s.altTitle}>That name is taken as a .com. These close names are free:</p>
              <ul className={s.results}>
                {alternatives.map(r => r.quote && (
                  <li key={r.domain} className={s.result}>
                    <DomainName domain={r.domain} />
                    <span className={s.resultRight}>
                      <span className={s.price}>
                        <div className={s.priceTotal}>{usd(r.quote.totalCents)}</div>
                        <div className={s.priceNote}>{usd(r.quote.registryCents)} + $1 fee, per year</div>
                      </span>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => choose(r)}>Select</button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pick && (
            <div className={s.confirm}>
              <div className={s.card}>
                <h3 className={s.cardTitle}>Confirm your purchase</h3>
                <table className={s.summary}><tbody>
                  <tr><td className={s.label}>Domain</td><td><strong>{pick.domain}</strong></td></tr>
                  <tr><td className={s.label}>Term</td><td>{pick.years} year{pick.years > 1 ? 's' : ''}</td></tr>
                  <tr><td className={s.label}>Registry price</td><td>{usd(pick.registryCents)}</td></tr>
                  <tr><td className={s.label}>Our fee</td><td>{usd(pick.marginCents)}</td></tr>
                  <tr className={s.total}><td className={s.label}>Total</td><td>{usd(pick.totalCents)}</td></tr>
                </tbody></table>
                {!projectId && (mine?.projects?.length ?? 0) > 0 && (
                  <div className={s.field}>
                    <label htmlFor="dm-site">Use it on</label>
                    <select id="dm-site" className={s.input} value={siteId} onChange={e => setSiteId(e.target.value)}>
                      <option value="">Decide later</option>
                      {mine!.projects!.map(p => <option key={p.id} value={p.id}>{p.name || 'Untitled site'}</option>)}
                    </select>
                  </div>
                )}
                <ul className={s.policy}>{policy.map(l => <li key={l}>{l}</li>)}</ul>
                <label className={s.ack}><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /><span>I have read this and want to buy {pick.domain} for {usd(pick.totalCents)}.</span></label>
                <div className={s.actions}>
                  <button className={s.btn} disabled={!ack || busy} onClick={() => pay('domain')}>{sandbox ? 'Buy in sandbox' : `Pay ${usd(pick.totalCents)}`}</button>
                  <button className={s.ghost} onClick={() => setPick(null)}>Back to results</button>
                </div>
                <p className={s.after}>After payment we register the domain, point it at your site and issue the certificate. You do nothing.</p>
              </div>
              {registrant}
            </div>
          )}
        </>
      )}

      {tab === 'workspace' && (
        <>
          <p className={s.lead}>Email on your own domain with <strong>Google Workspace Business Starter</strong>. Our price is the Google Workspace price plus a flat 50 cents per seat per month, sold for 12 months.</p>
          <div className={s.wsRow}>
            <div className={s.field}><label htmlFor="ws-domain">Your domain</label><input id="ws-domain" className={s.big} placeholder="yourdomain.com" value={wsDomain} onChange={e => setWsDomain(e.target.value)} /></div>
            <div className={s.field}><label htmlFor="ws-seats">Seats</label><input id="ws-seats" className={s.big} type="number" min={1} max={50} value={seats} onChange={e => setSeats(Number(e.target.value))} /></div>
            <button className={`${s.btn} ${s.btnSearch}`} disabled={busy || !wsDomain.includes('.')} onClick={wsPreview}>Price it</button>
          </div>
          {wsQuote && (
            <div className={s.confirm}>
              <div className={s.card}>
                <h3 className={s.cardTitle}>Confirm your purchase</h3>
                <table className={s.summary}><tbody>
                  <tr><td className={s.label}>Item</td><td>Google Workspace Business Starter for <strong>{wsDomain}</strong></td></tr>
                  <tr><td className={s.label}>Seats and term</td><td>{wsQuote.seats} seats, {wsQuote.months} months</td></tr>
                  <tr><td className={s.label}>Google Workspace price</td><td>{usd(wsQuote.registryCents)}</td></tr>
                  <tr><td className={s.label}>Our fee ({usd(wsQuote.perSeatMonthMarginCents)} per seat per month)</td><td>{usd(wsQuote.marginCents)}</td></tr>
                  <tr className={s.total}><td className={s.label}>Total</td><td>{usd(wsQuote.totalCents)}</td></tr>
                </tbody></table>
                {!wsConfirm ? <div className={s.actions}><button className={s.btn} onClick={() => setWsConfirm(true)}>Continue</button></div> : (
                  <>
                    <ul className={s.policy}>{wsPolicy.map(l => <li key={l}>{l}</li>)}</ul>
                    <label className={s.ack}><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /><span>I have read this and want to buy {wsQuote.seats} seats for {usd(wsQuote.totalCents)}.</span></label>
                    <div className={s.actions}><button className={s.btn} disabled={!ack || busy} onClick={() => pay('workspace')}>{sandbox ? 'Buy in sandbox' : `Pay ${usd(wsQuote.totalCents)}`}</button></div>
                  </>
                )}
                <p className={s.after}>Only Business Starter is offered for now. If the domain was bought here, the mail records are added for you. Otherwise copy them from My domains.</p>
              </div>
              {wsConfirm && registrant}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        <div className={s.list}>
          {!mine && <p className={s.lead}>Loading</p>}
          {mine?.orders.filter(o => o.status === 'needs_attention').map(o => (
            <div key={o.id} className={`${s.notice} ${s.noticeBad}`}><span className={s.dot} />We took payment for {o.domain} but could not finish the order. We have been told and will finish it or refund you. Reference {o.id.slice(0, 8)}.</div>
          ))}
          {mine && mine.domains.length === 0 && mine.workspaces.length === 0 && (
            <div className={s.empty}><p className={s.emptyTitle}>No domains yet</p><p style={{ margin: 0 }}>When you buy a domain here, it shows up with its connection status.</p></div>
          )}
          {mine?.domains.map(d => {
            const st = STATUS[d.connection]
            return (
              <div key={d.domain} className={s.item}>
                <div className={s.itemHead}>
                  <div><DomainName domain={d.domain} /><div className={s.meta}>{d.expires_at ? `Expires ${new Date(d.expires_at).toLocaleDateString()} (${d.daysLeft} days). We email you at 30, 14, 7 and 1 days. It does not renew by itself.` : 'Expiry date is still being confirmed.'}</div></div>
                  <span className={`${s.pill} ${st.cls}`}>{st.pill}</span>
                </div>
                <ol className={s.steps}>
                  {STEP_LABELS.map((label, i) => <li key={label} className={`${s.step} ${i < st.done ? s.stepDone : i === st.done && d.connection !== 'live' ? s.stepNow : ''}`}>{label}</li>)}
                </ol>
                <div className={s.itemHead}>
                  <span className={s.meta}>{st.note}</span>
                  <span className={s.actions}>
                    {d.expires_at && <button className={s.ghost} onClick={() => openRenew('domain', d.domain)}>{renew?.domain === d.domain && renew.kind === 'domain' ? 'Close' : 'Renew'}</button>}
                    {d.connection !== 'live' && <button className={s.ghost} onClick={() => retry(d.domain)}>Try again</button>}
                  </span>
                </div>
                {renewPanel('domain', d.domain)}
                {!d.project_id && (mine?.projects?.length ?? 0) > 0 && (
                  <div className={s.attachRow}>
                    <label className={s.meta} htmlFor={`attach-${d.domain}`}>Not on a site yet. Use it on</label>
                    <select id={`attach-${d.domain}`} className={s.input} defaultValue="" onChange={e => attachSite(d.domain, e.target.value)}>
                      <option value="" disabled>Choose a site</option>
                      {mine!.projects!.map(p => <option key={p.id} value={p.id}>{p.name || 'Untitled site'}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
          {mine?.workspaces.map(w => (
            <div key={w.domain} className={s.item}>
              <div className={s.itemHead}>
                <div><div className={s.itemName}>Google Workspace on {w.domain}</div><div className={s.meta}>{w.seats} seats{w.expires_at ? `. Ends ${new Date(w.expires_at).toLocaleDateString()} (${w.daysLeft} days)` : ''}</div></div>
                <span className={`${s.pill} ${w.records?.written ? s.pillLive : s.pillWait}`}>{w.records?.written ? 'Mail connected' : 'Records needed'}</span>
              </div>
              {!w.records?.written && <p className={s.meta} style={{ margin: 0 }}>Add these records where your domain is managed:</p>}
              <pre className={s.records}>{(w.records?.records ?? []).map(r => `${r.type}  ${r.host}  ${r.priority != null ? r.priority + '  ' : ''}${r.value}`).join('\n')}</pre>
              <div className={s.actions}>
                <button className={s.ghost} onClick={() => navigator.clipboard?.writeText((w.records?.records ?? []).map(r => `${r.type}\t${r.host}\t${r.priority ?? ''}\t${r.value}`).join('\n'))}>Copy records</button>
                {w.expires_at && <button className={s.ghost} onClick={() => openRenew('workspace', w.domain)}>{renew?.domain === w.domain && renew.kind === 'workspace' ? 'Close' : 'Renew'}</button>}
              </div>
              {renewPanel('workspace', w.domain)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
