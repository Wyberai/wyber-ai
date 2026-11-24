'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import s from './DomainsManager.module.css'
import { VERCEL_A_IP, VERCEL_CNAME } from '@/lib/dns-records'

// "Domains" screen, used inside the editor (projectId given: the bought domain is connected to that site) and on
// /dashboard/domains. Search, confirm (item, price, term, total, policy), pay, then watch the connection status.

type Quote = { domain: string; years: number; registryCents: number; marginCents: number; totalCents: number; renewalTotalCents: number | null }
type Result = { domain: string; tld: string; status: 'available' | 'taken' | 'unknown' | 'not_offered'; quote: Quote | null }
type Contact = { name: string; company: string; email: string; address1: string; city: string; state: string; zip: string; country: string; phoneCc: string; phone: string }
type Row = { domain: string; connection: 'dns_pending' | 'certificate_pending' | 'live' | 'needs_attention'; expires_at: string | null; daysLeft: number | null; project_id: string | null }
type Site = { id: string; name: string | null }
type WorkspaceRow = { domain: string; admin_email?: string | null; seats: number; expires_at: string | null; daysLeft: number | null; records: { records: { type: string; host: string; value: string; priority?: number }[]; written: boolean } | null }
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

const CC: Record<string, string> = { IN: '91', US: '1', GB: '44', AE: '971', CA: '1', AU: '61', SG: '65' }
const COUNTRY_BY_NAME: Record<string, string> = { india: 'IN', 'united states': 'US', usa: 'US', 'united kingdom': 'GB', uk: 'GB', uae: 'AE', 'united arab emirates': 'AE', canada: 'CA', australia: 'AU', singapore: 'SG' }
/** The Clients page leaves the client's details so the client, not the freelancer, is the legal owner of the domain. */
function fromHandoff(h: Record<string, string>): Contact {
  const raw = (h.country || 'IN').trim()
  const country = raw.length === 2 ? raw.toUpperCase() : (COUNTRY_BY_NAME[raw.toLowerCase()] ?? raw.slice(0, 2).toUpperCase())
  const digits = (h.phone || '').replace(/\D/g, '')
  const cc = CC[country] ?? ''
  const national = cc && digits.startsWith(cc) && digits.length > cc.length + 6 ? digits.slice(cc.length) : digits
  return { ...EMPTY, name: `${h.firstName ?? ''} ${h.lastName ?? ''}`.trim(), email: h.email ?? '', address1: h.address1 ?? '', city: h.city ?? '', state: h.state ?? '', zip: h.zip ?? '', country, phoneCc: cc || '91', phone: national }
}

function DomainName({ domain }: { domain: string }) {
  const i = domain.indexOf('.')
  return <span className={s.name}>{domain.slice(0, i)}<span>{domain.slice(i)}</span></span>
}

export default function DomainsManager({ projectId = null, initialContact = null }: { projectId?: string | null; initialContact?: Record<string, string> | null }) {
  const [tab, setTab] = useState<'domains' | 'workspace' | 'mine'>('domains')
  const [q, setQ] = useState('')
  const [years, setYears] = useState(1)
  const [results, setResults] = useState<Result[] | null>(null)
  const [pick, setPick] = useState<Quote | null>(null)
  const [contact, setContact] = useState<Contact>(EMPTY)
  const [editOwner, setEditOwner] = useState(false)
  const [siteTouched, setSiteTouched] = useState(false)
  const [info, setInfo] = useState('')
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
  const [mine, setMine] = useState<{ domains: Row[]; workspaces: WorkspaceRow[]; orders: { id: string; domain: string; status: string; error: string | null }[]; projects?: Site[]; workspaceEnabled?: boolean; defaultContact?: Contact | null } | null>(null)
  const [wsDomain, setWsDomain] = useState('')
  const [seats, setSeats] = useState(3)
  const [wsQuote, setWsQuote] = useState<WsQuote | null>(null)
  const [wsPolicy, setWsPolicy] = useState<string[]>([])
  const [wsConfirm, setWsConfirm] = useState(false)
  const [wsRenewal, setWsRenewal] = useState<number | null>(null)
  const [wsOther, setWsOther] = useState(false)
  const [wsPricing, setWsPricing] = useState(false)
  const [alternatives, setAlternatives] = useState<Result[]>([])
  const [siteId, setSiteId] = useState('')
  const [track, setTrack] = useState<{ id: string; domain: string; kind: string; status: string } | null>(null)
  const [renew, setRenew] = useState<{ kind: 'domain' | 'workspace'; domain: string; term: number } | null>(null)
  const [rq, setRq] = useState<{ preview: { seats: number | null; term: number; registryCents: number; marginCents: number; totalCents: number; expiresAt: string; newExpiresAt: string }; policy: string[] } | null>(null)
  const [rAck, setRAck] = useState(false)
  const [move, setMove] = useState<{ domain: string; code: string | null; locked: boolean | null } | null>(null)

  const loadMine = useCallback(async () => {
    const r = await fetch('/api/domains/mine')
    if (r.ok) setMine(await r.json())
  }, [])
  useEffect(() => { loadMine() }, [loadMine])

  // Workspace: start from a domain bought here, and price it as soon as there is a domain and a seat count.
  useEffect(() => {
    if (wsOther || wsDomain || !mine?.domains?.length) return
    setWsDomain(mine.domains[0].domain)
  }, [mine?.domains, wsOther, wsDomain])
  useEffect(() => {
    if (tab !== 'workspace' || !wsDomain.includes('.') || !(seats >= 1)) return
    const t = setTimeout(() => { wsPreview() }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, wsDomain, seats, contact.country])

  // Saved owner details (the last order's, or the account's name and email): a returning buyer sees one line and one button.
  useEffect(() => {
    const d = mine?.defaultContact
    if (d) setContact(c => (c.name || c.address1 ? c : { ...EMPTY, ...d }))
  }, [mine?.defaultContact])
  // The agency hand-off: the client's details, so the client is the legal owner.
  useEffect(() => { if (initialContact) setContact(fromHandoff(initialContact)) }, [initialContact])
  // The most recently edited site is the default, so the domain connects without a choice (outside a site's own editor).
  useEffect(() => {
    if (projectId || siteTouched || siteId || !mine?.projects?.length) return
    setSiteId(mine.projects[0].id)
  }, [projectId, siteTouched, siteId, mine?.projects])
  // /dashboard/domains?q=name opens with that name already searched (the Claude connector and "get a domain" links use it).
  useEffect(() => {
    const term = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') : null
    if (term && term.trim().length >= 2) { setQ(term); search(term) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function search(term = q) {
    setBusy(true); setMsg(''); setPick(null); setAck(false)
    const r = await fetch(`/api/domains/search?q=${encodeURIComponent(term)}&years=${years}`)
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setMsg(j.error || 'Search failed')
    setResults(j.results); setAlternatives(j.alternatives ?? []); setSandbox(j.sandbox); setPolicyByTld(j.policyByTld ?? {})
  }

  // ── Move to another provider ──
  async function transferAction(domain: string, action: 'unlock' | 'lock') {
    setBusy(true); setMsg('')
    const r = await fetch('/api/domains/transfer-out', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain, action }) })
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) { setMsg(`We could not ${action} ${domain}: ${j.error || 'please try again in a few minutes'}.`); return }
    setMove({ domain, code: j.authCode ?? null, locked: Boolean(j.locked) })
  }
  const movePanel = (domain: string) => move?.domain === domain && (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Move {domain} to another provider</h3>
      <p className={s.cardHint}>You own this domain, so you can take it anywhere. We do not charge to let it go.</p>
      <ol className={s.policy} style={{ listStyle: 'decimal', paddingLeft: 30 }}>
        <li>Unlock it and get the transfer code (below).</li>
        <li>Give the code to your new provider, on their &ldquo;transfer a domain in&rdquo; page, and pay their transfer fee. Most providers add a year to the domain when it moves.</li>
        <li>It usually takes a few days. Either provider may email you to approve it.</li>
        <li>Keep your site working: add the records below at the new provider, or your site stops loading on this domain after the move.</li>
      </ol>
      {move.code ? (
        <div className={s.field}>
          <label>Transfer code (keep it private: anyone with it can start a transfer)</label>
          <pre className={s.records} style={{ userSelect: 'all' }}>{move.code}</pre>
          <div className={s.actions}>
            <button className={s.ghost} onClick={() => navigator.clipboard?.writeText(move.code!)}>Copy code</button>
            <button className={s.ghost} disabled={busy} onClick={() => transferAction(domain, 'lock')}>Lock it again</button>
          </div>
        </div>
      ) : (
        <div className={s.actions}>
          <button className={s.btn} disabled={busy} onClick={() => transferAction(domain, 'unlock')}>{move.locked === false ? 'Show the code again' : 'Unlock and show the transfer code'}</button>
          <button className={s.ghost} onClick={() => setMove(null)}>Close</button>
        </div>
      )}
      <div className={s.field}>
        <label>Records to keep your site working</label>
        <pre className={s.records}>{`A      @    ${VERCEL_A_IP}\nCNAME  www  ${VERCEL_CNAME}`}</pre>
      </div>
      <p className={s.after}>A domain cannot be moved in its first 60 days after registration. If the provider refuses, its reason is shown above. We email the owner whenever the lock changes.</p>
    </div>
  )

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
    setBusy(true); setMsg(''); setInfo('')
    const tab = openPaymentTab()
    const body = { kind: renew.kind, domain: renew.domain, years: renew.term, months: renew.term, confirmedTotalCents: rq.preview.totalCents, acknowledged: true }
    const r = await fetch('/api/domains/renew', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (r.status === 409) { tab?.close(); setBusy(false); setMsg(`The price changed to ${usd(j.totalCents)}. Open Renew again to see it.`); setRenew(null); return }
    if (!r.ok) { tab?.close(); setBusy(false); return setMsg(j.error || 'Could not start the renewal') }
    if (j.sandbox) {
      tab?.close()
      await fetch('/api/domains/sandbox-pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: j.orderId }) })
      setBusy(false); setRenew(null); setInfo('Sandbox renewal complete. No money was taken.'); loadMine(); return
    }
    goToPayment(j.url, tab)
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
          <p className={s.after}>By pressing Renew you accept the terms above.</p>
          <div className={s.actions}>
            <button className={s.btn} disabled={busy} onClick={payRenew}>{busy ? 'Opening payment' : sandbox ? 'Renew in sandbox' : `Renew for ${usd(rq.preview.totalCents)}`}</button>
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

  const contactComplete = [contact.name, contact.email, contact.address1, contact.city, contact.state, contact.zip, contact.phoneCc, contact.phone].every(v => v.trim().length > 0) && contact.country.trim().length === 2

  // Inside a site's editor the payment page opens in a NEW tab, so a build in progress is never lost. The blank tab has to be
  // opened inside the click itself, or the browser's popup blocker swallows it.
  function openPaymentTab(): Window | null { return projectId ? window.open('about:blank', '_blank') : null }
  function goToPayment(url: string, tab: Window | null) {
    if (tab) { tab.location.href = url; setBusy(false); setInfo('The payment page opened in a new tab. When you have paid, it shows up under My domains.'); return }
    window.location.href = url
  }

  async function pay(kind: 'domain' | 'workspace') {
    setBusy(true); setMsg(''); setInfo('')
    const tab = openPaymentTab()
    // Pressing Buy on a screen that shows the item, term, price, total and terms is the confirmation. The server still re-prices.
    const body = kind === 'domain'
      ? { domain: pick!.domain, years: pick!.years, projectId: projectId ?? (siteId || null), contact, confirmedTotalCents: pick!.totalCents, acknowledged: true }
      : { domain: wsDomain, seats, months: 12, contact, confirmedTotalCents: wsQuote!.totalCents, acknowledged: true }
    const r = await fetch(kind === 'domain' ? '/api/domains/checkout' : '/api/workspace/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (r.status === 409) { tab?.close(); setBusy(false); setMsg(`The price changed to ${usd(j.totalCents)}. Search again to see it.`); return }
    if (!r.ok) { tab?.close(); setBusy(false); return setMsg(j.error || 'Could not start checkout') }
    if (j.sandbox) {
      tab?.close()
      await fetch('/api/domains/sandbox-pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: j.orderId }) })
      setBusy(false); setInfo('Sandbox purchase complete. No money was taken.'); setTab('mine'); loadMine(); return
    }
    goToPayment(j.url, tab)
  }

  async function wsPreview() {
    setWsPricing(true)
    const r = await fetch(`/api/workspace/quote?seats=${seats}&country=${contact.country}&domain=${encodeURIComponent(wsDomain || 'yourdomain.com')}`)
    const j = await r.json().catch(() => ({}))
    setWsPricing(false)
    if (!r.ok) { setWsQuote(null); return setMsg(j.error || 'Could not price this') }
    if (!j.quote) { setWsQuote(null); return setMsg('Workspace pricing is not available yet') }
    setMsg(''); setWsQuote(j.quote); setWsPolicy(j.policy); setWsRenewal(j.renewalTotalCents ?? null)
  }

  async function retry(domain: string) {
    setMsg('')
    const r = await fetch('/api/domains/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain }) })
    const j = await r.json().catch(() => ({}))
    // Say why, not just "it did not work": the registrar or the hosting gives a reason.
    if (!r.ok) setMsg(`We could not finish connecting ${domain} yet: ${j.error || 'please try again in a few minutes'}.`)
    else if (j.error) setMsg(`${domain} is connected at the registrar, but our hosting said: ${j.error}. We will keep trying.`)
    loadMine()
  }

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => setContact(c => ({ ...c, [k]: e.target.value }))
  const registrantFields = (
    <>
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
    </>
  )
  const registrant = <div className={s.card}>{registrantFields}</div>

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
      {info && <div role="status" className={s.notice}><span className={s.dot} />{info}</div>}
      {msg && <div ref={msgRef} role="alert" className={`${s.notice} ${s.noticeBad}`}><span className={s.dot} />{msg}</div>}

      {tab === 'domains' && (
        <>
          <p className={s.lead}>Our price is the registry price plus a <strong>flat $1</strong>, and the same $1 when you renew. Type your business name and see every extension at once.</p>
          <div className={s.searchRow}>
            <div className={s.searchField}>
              <input className={s.big} placeholder="ashabakery" aria-label="Domain name" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && q.trim().length >= 2 && search()} />
            </div>
            <select className={s.select} aria-label="Years" value={years} onChange={e => setYears(Number(e.target.value))}>{[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}</select>
            <button className={`${s.btn} ${s.btnSearch}`} disabled={busy || q.trim().length < 2} onClick={() => search()}>{busy && !pick ? 'Searching' : 'Search'}</button>
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
            <div className={s.card}>
              <h3 className={s.cardTitle}>Buy {pick.domain}</h3>
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
                  <select id="dm-site" className={s.input} value={siteId} onChange={e => { setSiteTouched(true); setSiteId(e.target.value) }}>
                    <option value="">Decide later</option>
                    {mine!.projects!.map(p => <option key={p.id} value={p.id}>{p.name || 'Untitled site'}</option>)}
                  </select>
                </div>
              )}
              {contactComplete && !editOwner ? (
                <div className={s.ownerLine}>
                  <div>
                    <div className={s.meta}>Registered to</div>
                    <strong>{contact.name}</strong> <span className={s.meta}>{contact.email} &middot; {contact.city}, {contact.country}</span>
                  </div>
                  <button className={s.ghost} onClick={() => setEditOwner(true)}>Change</button>
                </div>
              ) : registrantFields}
              <ul className={s.policy}>{policy.map(l => <li key={l}>{l}</li>)}</ul>
              <div className={s.actions}>
                <button className={s.btn} disabled={busy || !contactComplete} onClick={() => pay('domain')}>{busy ? 'Opening payment' : sandbox ? 'Buy in sandbox' : `Buy for ${usd(pick.totalCents)}`}</button>
                <button className={s.ghost} onClick={() => setPick(null)}>Back to results</button>
              </div>
              {!contactComplete && <p className={s.after}>Add the owner&apos;s details to continue.</p>}
              <p className={s.after}>By pressing Buy you accept the terms above. After payment we register the domain, connect it to your site and issue the free certificate. You do nothing.</p>
            </div>
          )}
        </>
      )}

      {tab === 'workspace' && (
        <>
          <p className={s.lead}>Email on your own domain with <strong>Google Workspace Business Starter</strong>: name@yourdomain, Gmail, Calendar and Drive. Our price is the Google Workspace price plus a flat 50 cents per seat per month, for 12 months.</p>
          <div className={s.wsRow}>
            <div className={s.field}>
              <label htmlFor="ws-domain">Your domain</label>
              {(mine?.domains?.length ?? 0) > 0 && !wsOther ? (
                <select id="ws-domain" className={s.big} value={wsDomain} onChange={e => { if (e.target.value === '__other') { setWsOther(true); setWsDomain(''); setWsQuote(null) } else setWsDomain(e.target.value) }}>
                  {mine!.domains.map(d => <option key={d.domain} value={d.domain}>{d.domain}</option>)}
                  <option value="__other">A domain I own somewhere else</option>
                </select>
              ) : (
                <input id="ws-domain" className={s.big} placeholder="yourdomain.com" value={wsDomain} onChange={e => setWsDomain(e.target.value.trim().toLowerCase())} />
              )}
            </div>
            <div className={s.field}><label htmlFor="ws-seats">Seats</label><input id="ws-seats" className={s.big} type="number" min={1} max={50} value={seats} onChange={e => setSeats(Number(e.target.value))} /></div>
          </div>
          {wsPricing && !wsQuote && <p className={s.cardHint}>Getting the price</p>}
          {wsQuote && (
            <div className={s.card}>
              <h3 className={s.cardTitle}>Email for {wsDomain}</h3>
              <table className={s.summary}><tbody>
                <tr><td className={s.label}>Item</td><td>Google Workspace Business Starter</td></tr>
                <tr><td className={s.label}>Seats and term</td><td>{wsQuote.seats} seat{wsQuote.seats === 1 ? '' : 's'}, {wsQuote.months} months</td></tr>
                <tr><td className={s.label}>Google Workspace price</td><td>{usd(wsQuote.registryCents)}</td></tr>
                <tr><td className={s.label}>Our fee ({usd(wsQuote.perSeatMonthMarginCents)} per seat per month)</td><td>{usd(wsQuote.marginCents)}</td></tr>
                <tr className={s.total}><td className={s.label}>Total</td><td>{usd(wsQuote.totalCents)}</td></tr>
                {wsRenewal != null && <tr><td className={s.label}>Renews at, for the same seats</td><td>{usd(wsRenewal)} for 12 months</td></tr>}
              </tbody></table>
              {contactComplete && !editOwner ? (
                <div className={s.ownerLine}>
                  <div>
                    <div className={s.meta}>Account owner</div>
                    <strong>{contact.name}</strong> <span className={s.meta}>{contact.email}</span>
                  </div>
                  <button className={s.ghost} onClick={() => setEditOwner(true)}>Change</button>
                </div>
              ) : registrantFields}
              <ul className={s.policy}>{wsPolicy.map(l => <li key={l}>{l}</li>)}</ul>
              <div className={s.actions}>
                <button className={s.btn} disabled={busy || !contactComplete || wsPricing} onClick={() => pay('workspace')}>{busy ? 'Opening payment' : sandbox ? 'Buy in sandbox' : `Buy for ${usd(wsQuote.totalCents)}`}</button>
              </div>
              {!contactComplete && <p className={s.after}>Add the owner&apos;s details to continue.</p>}
              <p className={s.after}>By pressing Buy you accept the terms above. We set up <strong>admin@{wsDomain}</strong> and ask Google to send its sign-in setup to {contact.email || 'your email'}. {mine?.domains?.some(d => d.domain === wsDomain) ? 'The mail records are added to your domain for you.' : 'The mail records to add at your domain\'s DNS provider appear under My domains after payment.'} Only Business Starter is offered for now.</p>
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
                    <button className={s.ghost} onClick={() => setMove(move?.domain === d.domain ? null : { domain: d.domain, code: null, locked: null })}>{move?.domain === d.domain ? 'Close move' : 'Move to another provider'}</button>
                  </span>
                </div>
                {renewPanel('domain', d.domain)}
                {movePanel(d.domain)}
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
              <div className={s.meta}>Admin account: <strong>{w.admin_email || `admin@${w.domain}`}</strong> &middot; <a className={s.link} href={`https://mail.google.com/a/${w.domain}`} target="_blank" rel="noopener noreferrer">Open Gmail</a> &middot; <a className={s.link} href="https://admin.google.com" target="_blank" rel="noopener noreferrer">Google Admin</a>. Google sends the admin sign-in setup to the email you gave us.</div>
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
