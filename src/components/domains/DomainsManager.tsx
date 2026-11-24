'use client'

import { useCallback, useEffect, useState } from 'react'
import s from './DomainsManager.module.css'

// "Domains" screen, used inside the editor (projectId given: the bought domain is connected to that site) and on
// /dashboard/domains. Search, confirm (item, price, term, total, policy), pay, then watch the connection status.

type Quote = { domain: string; years: number; registryCents: number; marginCents: number; totalCents: number; renewalTotalCents: number | null }
type Result = { domain: string; tld: string; status: 'available' | 'taken' | 'unknown' | 'not_offered'; quote: Quote | null }
type Contact = { name: string; company: string; email: string; address1: string; city: string; state: string; zip: string; country: string; phoneCc: string; phone: string }
type Row = { domain: string; connection: 'dns_pending' | 'certificate_pending' | 'live' | 'needs_attention'; expires_at: string | null; daysLeft: number | null; project_id: string | null }
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
  const [mine, setMine] = useState<{ domains: Row[]; workspaces: WorkspaceRow[]; orders: { id: string; domain: string; status: string; error: string | null }[] } | null>(null)
  const [wsDomain, setWsDomain] = useState('')
  const [seats, setSeats] = useState(3)
  const [wsQuote, setWsQuote] = useState<WsQuote | null>(null)
  const [wsPolicy, setWsPolicy] = useState<string[]>([])
  const [wsConfirm, setWsConfirm] = useState(false)

  const loadMine = useCallback(async () => {
    const r = await fetch('/api/domains/mine')
    if (r.ok) setMine(await r.json())
  }, [])
  useEffect(() => { loadMine() }, [loadMine])

  async function search() {
    setBusy(true); setMsg(''); setPick(null); setAck(false)
    const r = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}&years=${years}`)
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setMsg(j.error || 'Search failed')
    setResults(j.results); setSandbox(j.sandbox); setPolicyByTld(j.policyByTld ?? {})
  }

  function choose(res: Result) {
    if (!res.quote) return
    setPick(res.quote); setAck(false)
    setPolicy(policyByTld[res.tld] ?? [])
  }

  async function pay(kind: 'domain' | 'workspace') {
    setBusy(true); setMsg('')
    const body = kind === 'domain'
      ? { domain: pick!.domain, years: pick!.years, projectId, contact, confirmedTotalCents: pick!.totalCents, acknowledged: ack }
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
        {(['domains', 'workspace', 'mine'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => { setTab(t); setMsg(''); if (t === 'mine') loadMine() }}>
            {t === 'domains' ? 'Buy a domain' : t === 'workspace' ? 'Google Workspace' : 'My domains'}
          </button>
        ))}
      </div>
      {sandbox && <div className={`${s.notice} ${s.noticeWarn}`}><span className={s.dot} />Sandbox mode: prices are examples and nothing is charged or registered.</div>}
      {msg && <div role="status" className={s.notice}><span className={s.dot} />{msg}</div>}

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
          <p className={s.lead}>Email on your own domain with <strong>Google Workspace Business Starter</strong>. Our price is the reseller price plus a flat 50 cents per seat per month, sold for 12 months.</p>
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
                  <tr><td className={s.label}>Reseller price</td><td>{usd(wsQuote.registryCents)}</td></tr>
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
                  {d.connection !== 'live' && <button className={s.ghost} onClick={() => retry(d.domain)}>Try again</button>}
                </div>
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
              <div><button className={s.ghost} onClick={() => navigator.clipboard?.writeText((w.records?.records ?? []).map(r => `${r.type}\t${r.host}\t${r.priority ?? ''}\t${r.value}`).join('\n'))}>Copy records</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
