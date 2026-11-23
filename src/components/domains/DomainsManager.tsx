'use client'

import { useCallback, useEffect, useState } from 'react'

// "Domains" screen, used inside the editor (projectId given: the bought domain is connected to that site) and on
// /dashboard/domains. Search, confirm (item, price, term, total, policy), pay, then watch the connection status.

type Quote = { domain: string; years: number; registryCents: number; marginCents: number; totalCents: number; renewalTotalCents: number | null }
type Result = { domain: string; tld: string; status: 'available' | 'taken' | 'unknown' | 'not_offered'; quote: Quote | null }
type Contact = { name: string; company: string; email: string; address1: string; city: string; state: string; zip: string; country: string; phoneCc: string; phone: string }
type Row = { domain: string; connection: 'dns_pending' | 'certificate_pending' | 'live' | 'needs_attention'; expires_at: string | null; daysLeft: number | null; project_id: string | null }
type WorkspaceRow = { domain: string; seats: number; expires_at: string | null; daysLeft: number | null; records: { records: { type: string; host: string; value: string; priority?: number }[]; written: boolean } | null }
type WsQuote = { seats: number; months: number; perSeatMonthCostCents: number; perSeatMonthMarginCents: number; registryCents: number; marginCents: number; totalCents: number }

const usd = (c: number) => `$${(c / 100).toFixed(2)}`
const STATUS: Record<Row['connection'], string> = {
  dns_pending: 'DNS pending: the records are being written and can take a few minutes to spread',
  certificate_pending: 'Certificate pending: DNS is right, the security certificate is being issued',
  live: 'Live',
  needs_attention: 'Needs attention: press Try again',
}
const EMPTY: Contact = { name: '', company: '', email: '', address1: '', city: '', state: '', zip: '', country: 'IN', phoneCc: '91', phone: '' }

const box = 'rounded-lg border border-black/10 dark:border-white/15 p-4'
const input = 'w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm'
const btn = 'rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 bg-black text-white dark:bg-white dark:text-black'
const ghost = 'rounded-md px-3 py-2 text-sm border border-black/15 dark:border-white/20'

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
    const j = await r.json()
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
    const j = await r.json()
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
    const j = await r.json()
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
  const contactForm = (
    <div className="grid grid-cols-2 gap-2">
      <p className="col-span-2 text-xs opacity-70">The registrant is the legal owner of the domain. Use the real owner&apos;s details.</p>
      {([['name', 'Full name'], ['company', 'Company (optional)'], ['email', 'Email'], ['phone', 'Phone number'], ['phoneCc', 'Country code (91)'], ['country', 'Country (IN)'], ['address1', 'Address'], ['city', 'City'], ['state', 'State'], ['zip', 'PIN or ZIP']] as [keyof Contact, string][]).map(([k, label]) => (
        <input key={k} className={`${input} ${k === 'address1' ? 'col-span-2' : ''}`} placeholder={label} aria-label={label} value={contact[k]} onChange={set(k)} />
      ))}
    </div>
  )

  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2" role="tablist">
        {(['domains', 'workspace', 'mine'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setMsg(''); if (t === 'mine') loadMine() }} className={`${ghost} ${tab === t ? 'bg-black/5 dark:bg-white/10' : ''}`}>
            {t === 'domains' ? 'Buy a domain' : t === 'workspace' ? 'Google Workspace' : 'My domains'}
          </button>
        ))}
      </div>
      {sandbox && <p className={`${box} text-xs`}>Sandbox mode: prices are examples and nothing is charged or registered.</p>}
      {msg && <p role="status" className={box}>{msg}</p>}

      {tab === 'domains' && (
        <div className="space-y-3">
          <p className="opacity-80">Our price is the registry price plus a flat $1. Type your business name.</p>
          <div className="flex gap-2">
            <input className={input} placeholder="ashabakery" aria-label="Domain name" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && q.trim() && search()} />
            <select className={ghost} aria-label="Years" value={years} onChange={e => setYears(Number(e.target.value))}>{[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}</select>
            <button className={btn} disabled={busy || q.trim().length < 2} onClick={search}>Search</button>
          </div>
          {results && !pick && (
            <ul className="space-y-2">
              {results.map(r => (
                <li key={r.domain} className={`${box} flex items-center justify-between`}>
                  <span className="font-medium">{r.domain}</span>
                  {r.status === 'available' && r.quote ? (
                    <span className="flex items-center gap-3">
                      <span>{usd(r.quote.totalCents)} <span className="opacity-60">({usd(r.quote.registryCents)} + $1)</span></span>
                      <button className={btn} onClick={() => choose(r)}>Select</button>
                    </span>
                  ) : <span className="opacity-60">{r.status === 'taken' ? 'Taken' : r.status === 'not_offered' ? 'Not offered yet' : 'Could not check, try again'}</span>}
                </li>
              ))}
            </ul>
          )}
          {pick && (
            <div className={`${box} space-y-3`}>
              <h3 className="font-semibold">Confirm your purchase</h3>
              <table className="w-full"><tbody>
                <tr><td>Item</td><td className="text-right">{pick.domain}</td></tr>
                <tr><td>Term</td><td className="text-right">{pick.years} year{pick.years > 1 ? 's' : ''}</td></tr>
                <tr><td>Registry price</td><td className="text-right">{usd(pick.registryCents)}</td></tr>
                <tr><td>Our fee</td><td className="text-right">{usd(pick.marginCents)}</td></tr>
                <tr className="font-semibold"><td>Total</td><td className="text-right">{usd(pick.totalCents)}</td></tr>
              </tbody></table>
              {contactForm}
              <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">{policy.map(l => <li key={l}>{l}</li>)}</ul>
              <label className="flex gap-2 items-start"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I have read this and want to buy {pick.domain} for {usd(pick.totalCents)}.</label>
              <div className="flex gap-2">
                <button className={btn} disabled={!ack || busy} onClick={() => pay('domain')}>{sandbox ? 'Buy in sandbox' : `Pay ${usd(pick.totalCents)}`}</button>
                <button className={ghost} onClick={() => setPick(null)}>Back</button>
              </div>
              <p className="text-xs opacity-70">After payment we register the domain, point it at your site and issue the certificate. You do nothing.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'workspace' && (
        <div className="space-y-3">
          <p className="opacity-80">Email on your own domain with Google Workspace (Business Starter). Our price is the reseller price plus a flat 50 cents per seat per month, sold for 12 months.</p>
          <div className="flex gap-2">
            <input className={input} placeholder="yourdomain.com" aria-label="Domain for email" value={wsDomain} onChange={e => setWsDomain(e.target.value)} />
            <input className={`${input} w-24`} type="number" min={1} max={50} aria-label="Seats" value={seats} onChange={e => setSeats(Number(e.target.value))} />
            <button className={btn} disabled={busy || !wsDomain.includes('.')} onClick={wsPreview}>Price it</button>
          </div>
          {wsQuote && (
            <div className={`${box} space-y-3`}>
              <h3 className="font-semibold">Confirm your purchase</h3>
              <table className="w-full"><tbody>
                <tr><td>Item</td><td className="text-right">Google Workspace Business Starter for {wsDomain}</td></tr>
                <tr><td>Seats and term</td><td className="text-right">{wsQuote.seats} seats, {wsQuote.months} months</td></tr>
                <tr><td>Reseller price</td><td className="text-right">{usd(wsQuote.registryCents)}</td></tr>
                <tr><td>Our fee ({usd(wsQuote.perSeatMonthMarginCents)} per seat per month)</td><td className="text-right">{usd(wsQuote.marginCents)}</td></tr>
                <tr className="font-semibold"><td>Total</td><td className="text-right">{usd(wsQuote.totalCents)}</td></tr>
              </tbody></table>
              {!wsConfirm ? <button className={btn} onClick={() => setWsConfirm(true)}>Continue</button> : (
                <>
                  {contactForm}
                  <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">{wsPolicy.map(l => <li key={l}>{l}</li>)}</ul>
                  <label className="flex gap-2 items-start"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I have read this and want to buy {wsQuote.seats} seats for {usd(wsQuote.totalCents)}.</label>
                  <button className={btn} disabled={!ack || busy} onClick={() => pay('workspace')}>{sandbox ? 'Buy in sandbox' : `Pay ${usd(wsQuote.totalCents)}`}</button>
                </>
              )}
              <p className="text-xs opacity-70">Only Business Starter is offered for now. If the domain was bought here, the mail records are added for you; otherwise copy them from My domains.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {!mine && <p className="opacity-70">Loading</p>}
          {mine?.orders.filter(o => o.status === 'needs_attention').map(o => (
            <p key={o.id} className={box}>We took payment for {o.domain} but could not finish the order. We have been told and will finish it or refund you. Reference {o.id.slice(0, 8)}.</p>
          ))}
          {mine && mine.domains.length === 0 && mine.workspaces.length === 0 && <p className="opacity-70">You have not bought a domain here yet.</p>}
          {mine?.domains.map(d => (
            <div key={d.domain} className={`${box} flex items-start justify-between gap-3`}>
              <div>
                <div className="font-medium">{d.domain}</div>
                <div className="text-xs opacity-80">{STATUS[d.connection]}</div>
                <div className="text-xs opacity-60">{d.expires_at ? `Expires ${new Date(d.expires_at).toLocaleDateString()} (${d.daysLeft} days). We email you at 30, 14, 7 and 1 days. It does not renew by itself.` : ''}</div>
              </div>
              {d.connection !== 'live' && <button className={ghost} onClick={() => retry(d.domain)}>Try again</button>}
            </div>
          ))}
          {mine?.workspaces.map(w => (
            <div key={w.domain} className={`${box} space-y-2`}>
              <div className="font-medium">Google Workspace on {w.domain} ({w.seats} seats)</div>
              <div className="text-xs opacity-60">{w.expires_at ? `Ends ${new Date(w.expires_at).toLocaleDateString()} (${w.daysLeft} days)` : ''}</div>
              <div className="text-xs">{w.records?.written ? 'Mail records are connected.' : 'Add these records where your domain is managed:'}</div>
              <pre className="text-xs overflow-x-auto">{(w.records?.records ?? []).map(r => `${r.type}  ${r.host}  ${r.priority != null ? r.priority + '  ' : ''}${r.value}`).join('\n')}</pre>
              <button className={ghost} onClick={() => navigator.clipboard?.writeText((w.records?.records ?? []).map(r => `${r.type}\t${r.host}\t${r.priority ?? ''}\t${r.value}`).join('\n'))}>Copy records</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
