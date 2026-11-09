'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The "watch it build" demo. It is an illustration (the page says so) of a typical small build: what you see is
 * what the product does (an error repaired for free, a security probe, a cost shown first), but the data is sample data.
 */

type TopicKey = 'inv' | 'stock' | 'del'
type Topic = { label: string; title: string; rows: string[][]; err: string }
const TOPICS_IN: Record<TopicKey, Topic> = {
  inv: { label: 'Invoices', title: 'Invoice tracker', rows: [['INV-1042', 'Sharma Traders', '18,400', 'Unpaid'], ['INV-1041', 'Patel Agro', '42,000', 'Paid'], ['INV-1040', 'Mehta and Sons', '9,750', 'Overdue']], err: 'Missing import in InvoiceList' },
  stock: { label: 'Stock', title: 'Stock tracker', rows: [['SKU-210', 'Basmati rice 25 kg', '48 left', 'Low'], ['SKU-118', 'Sugar 50 kg', '210 left', 'OK'], ['SKU-077', 'Cooking oil 15 L', '12 left', 'Low']], err: 'Missing import in StockTable' },
  del: { label: 'Deliveries', title: 'Delivery tracker', rows: [['ORD-882', 'Hardware order', 'Driver: Ravi', 'On the way'], ['ORD-881', 'Paint and tools', 'Driver: Imran', 'Delivered'], ['ORD-880', 'Pipes and fittings', 'Driver: Ravi', 'Proof missing']], err: 'Missing import in DeliveryList' },
}
// The same three examples for visitors outside India: neutral names and units, no rupee-style amounts.
const TOPICS_US: Record<TopicKey, Topic> = {
  inv: { label: 'Invoices', title: 'Invoice tracker', rows: [['INV-1042', 'Harper Supply', '1,840', 'Unpaid'], ['INV-1041', 'Cole Hardware', '4,200', 'Paid'], ['INV-1040', 'Reyes and Sons', '975', 'Overdue']], err: 'Missing import in InvoiceList' },
  stock: { label: 'Stock', title: 'Stock tracker', rows: [['SKU-210', 'Coffee beans 5 lb', '48 left', 'Low'], ['SKU-118', 'Sugar 25 lb', '210 left', 'OK'], ['SKU-077', 'Olive oil 1 gal', '12 left', 'Low']], err: 'Missing import in StockTable' },
  del: { label: 'Deliveries', title: 'Delivery tracker', rows: [['ORD-882', 'Hardware order', 'Driver: Sam', 'On the way'], ['ORD-881', 'Paint and tools', 'Driver: Dana', 'Delivered'], ['ORD-880', 'Pipes and fittings', 'Driver: Sam', 'Proof missing']], err: 'Missing import in DeliveryList' },
}

const COST = 30
type Line = { text: string; cls?: 'sg-err' | 'sg-ok' }

export function Theatre({ usd = false }: { usd?: boolean }) {
  const TOPICS = usd ? TOPICS_US : TOPICS_IN
  const [topic, setTopic] = useState<TopicKey>('inv')
  const [lines, setLines] = useState<Line[]>([])
  const [rowsOn, setRowsOn] = useState(0)
  const [badRow, setBadRow] = useState(false)
  const [head, setHead] = useState(false)
  const [credits, setCredits] = useState(0)
  const [fixes, setFixes] = useState(0)
  const [sec, setSec] = useState<'Waiting' | 'Scanning' | 'Locked'>('Waiting')
  const [done, setDone] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = []
    if (ticker.current) { clearInterval(ticker.current); ticker.current = null }
  }, [])
  const reset = useCallback(() => {
    clear(); setLines([]); setRowsOn(0); setBadRow(false); setHead(false); setCredits(0); setFixes(0); setSec('Waiting'); setDone(false)
  }, [clear])
  useEffect(() => clear, [clear])

  const tickTo = (to: number) => {
    if (ticker.current) clearInterval(ticker.current)
    ticker.current = setInterval(() => {
      setCredits(c => {
        const n = Math.min(to, c + 2)
        if (n >= to && ticker.current) { clearInterval(ticker.current); ticker.current = null }
        return n
      })
    }, 45)
  }

  const run = () => {
    reset()
    const d = TOPICS[topic]
    const add = (text: string, cls?: Line['cls']) => setLines(l => [...l, { text, cls }])
    const steps: [number, () => void][] = [
      [0, () => add('Reading your description')],
      [900, () => { add('Sketching 5 screens'); setHead(true); tickTo(12) }],
      [1900, () => { add('Building the database and sign-in'); setRowsOn(3); tickTo(26) }],
      [3300, () => { add('Error: ' + d.err, 'sg-err'); setBadRow(true) }],
      [4400, () => { add('Repaired automatically. No charge.', 'sg-ok'); setBadRow(false); setFixes(1); tickTo(COST) }],
      [5400, () => { add('Probing the live database the way an attacker would'); setSec('Scanning') }],
      [6700, () => { add('Locked: 0 rows readable without signing in', 'sg-ok'); setSec('Locked') }],
      [7600, () => { add('Ready to publish', 'sg-ok'); setDone(true) }],
    ]
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { steps.forEach(([, f]) => f()); setCredits(COST); return }
    steps.forEach(([ms, f]) => timers.current.push(setTimeout(f, ms)))
  }

  const d = TOPICS[topic]
  return (
    <div>
      <div className="sg-th">
        <div>
          <div className="sg-th-chips" role="group" aria-label="Pick a problem">
            {(Object.keys(TOPICS) as TopicKey[]).map(k => (
              <button key={k} type="button" className="sg-pill" aria-pressed={k === topic} onClick={() => { setTopic(k); reset() }}>{TOPICS[k].label}</button>
            ))}
          </div>
          <div className="sg-th-go">
            <button type="button" className="sg-btn" onClick={run}>Watch it build <span aria-hidden="true">→</span></button>
            <span>Estimated {COST} credits. Shown before every build.</span>
          </div>
          <ol className="sg-thlog" aria-live="polite">
            {lines.length === 0 ? <li className="sg-idle">Pick a problem and press the button.</li> : lines.map((l, i) => <li key={i} className={l.cls}>{l.text}</li>)}
          </ol>
        </div>
        <div>
          <div className="sg-win">
            <div className="sg-wbar"><i /><i /><i /><span>{d.title}</span></div>
            <div className="sg-wbody">
              <div className={'sg-wh' + (head ? ' sg-on' : '')}>{head ? d.title : ''}</div>
              {d.rows.map((r, i) => (
                <div key={r[0]} className={'sg-wr' + (i < rowsOn ? ' sg-on' : '') + (i === 1 && badRow ? ' sg-bad' : '')}>
                  <span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><span>{r[3]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sg-meters">
            <div><span>Credits</span><b>{credits}</b></div>
            <div><span>Auto-fixes</span><b className={fixes ? 'sg-good' : ''}>{fixes}</b></div>
            <div><span>Security</span><b className={sec === 'Locked' ? 'sg-good' : ''}>{sec}</b></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {done && (
          <div className="sg-receipt">
            <h3>Receipt · {d.title}</h3>
            <div className="sg-rrow"><span>Small build, estimated</span><i /><b>{COST}</b></div>
            <div className="sg-rrow"><span>Automatic error fix (1)</span><i /><b className="sg-free">free</b></div>
            <div className="sg-rrow"><span>Security check before publish</span><i /><b className="sg-free">included</b></div>
            <div className="sg-rrow"><span>Publish</span><i /><b className="sg-free">free</b></div>
            <div className="sg-rrow sg-rtot"><span>Total</span><i /><b>about {COST} credits</b></div>
            <p className="sg-rfoot">An estimate. The exact cost is shown before every build. Credits never expire.</p>
          </div>
        )}
        <p className="sg-note" style={{ textAlign: 'left' }}>An illustration of a typical small build. Real builds vary by size.</p>
      </div>
    </div>
  )
}
