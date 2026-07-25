// GTM demo template #3: an AI-native "Seller Command Center" for Amazon / Etsy /
// Shopify marketplace sellers. Same engine as the security/dev-shop templates
// (stamp -> publish -> live demo), new surface.
//
// Positioning: margin, inventory and orders scattered across three marketplace
// logins and a spreadsheet, pulled into one AI-native dashboard — mirrors the
// pain point already proven on the /ecommerce landing page.
//
// UNLIKE the security/devshop templates, this one is published ONCE as a single
// shared demo (not stamped per-lead) — every outreach email links to the same
// URL, so there is no {{CLAIM_URL}} token here. The footer CTA is a plain link
// to /signup instead.
//
// HONESTY CONTRACT (do not weaken): all numbers are sample placeholders and are
// marked as such; the dashboard does not claim to auto-connect to a seller's
// real Amazon/Etsy/Shopify account (matches the /ecommerce page's FAQ answer).

export const SELLER_COCKPIT_TOKENS = ['{{COMPANY_NAME}}', '{{FIRST_NAME}}', '{{BRAND_INITIAL}}'] as const

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{COMPANY_NAME}} · Seller Command Center</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Sky Precision — near-black canvas, single sky-blue accent, hairline borders. */
:root,
.dark {
  --background: 220 26% 4%;
  --foreground: 210 20% 96%;
  --card: 220 22% 6%;
  --card-foreground: 210 20% 96%;
  --popover: 220 22% 7%;
  --popover-foreground: 210 20% 96%;
  --primary: 199 89% 48%;
  --primary-foreground: 210 100% 6%;
  --secondary: 220 15% 10%;
  --secondary-foreground: 210 20% 96%;
  --muted: 220 15% 10%;
  --muted-foreground: 218 10% 60%;
  --accent: 218 18% 12%;
  --accent-foreground: 199 80% 80%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 210 20% 98%;
  --success: 152 60% 45%;
  --warning: 38 92% 55%;
  --border: 218 15% 14%;
  --input: 218 15% 14%;
  --ring: 199 89% 48%;
  --radius: 0.5rem;
  --font-sans: 'Switzer', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'General Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
}

html { scroll-behavior: smooth; }
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.font-mono { font-family: var(--font-mono); }
.font-display { font-family: var(--font-display); }
::selection { background: hsl(var(--primary) / 0.25); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
@keyframes wyber-bounce { 0%,80%,100% { transform: translateY(0); opacity: .35 } 40% { transform: translateY(-4px); opacity: 1 } }
.wdot { animation: wyber-bounce 1s infinite; }
.hero-glow { background: radial-gradient(120% 130% at 85% -10%, hsl(199 89% 48% / 0.14), transparent 55%); }`

const APP_TSX = `import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  LayoutDashboard, RefreshCw, Package, Store, ClipboardList, Plug,
  Sparkles, Send, X, ArrowUpRight, ArrowDownRight, Bot,
  Database, KeyRound, Truck, CreditCard, ChevronRight, Zap, Target,
  FileDown, ArrowRight, AlertTriangle,
} from 'lucide-react'

// ── Everything below is SAMPLE data. Nothing here is the seller's real data. ──

const REV_COST = [
  { m: 'Feb', rev: 41, cost: 27 }, { m: 'Mar', rev: 46, cost: 30 },
  { m: 'Apr', rev: 52, cost: 34 }, { m: 'May', rev: 58, cost: 37 },
  { m: 'Jun', rev: 63, cost: 40 }, { m: 'Jul', rev: 71, cost: 44 },
]
const CHANNEL_MIX = [
  { name: 'Amazon', value: 54 }, { name: 'Etsy', value: 21 },
  { name: 'Shopify', value: 17 }, { name: 'Walmart', value: 8 },
]
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(199 80% 65%)', 'hsl(199 40% 45%)', 'hsl(218 12% 30%)']
const LOW_STOCK = [
  { sku: 'Bamboo Diaper Caddy — Grey', channel: 'Amazon', qty: 6, threshold: 20 },
  { sku: 'Coffee Chapstick 3-pack', channel: 'Etsy', qty: 11, threshold: 25 },
  { sku: 'Terry Headband — Sage', channel: 'Amazon', qty: 3, threshold: 15 },
  { sku: 'Vegan Body Cream 3oz', channel: 'Shopify', qty: 9, threshold: 20 },
]
const ORDERS = [
  { date: 'Jul 19', channel: 'Amazon', product: 'Bamboo Diaper Caddy', revenue: 34.99, margin: 11.20 },
  { date: 'Jul 19', channel: 'Etsy', product: 'Coffee Chapstick 3-pack', revenue: 18.50, margin: 9.75 },
  { date: 'Jul 18', channel: 'Shopify', product: 'Vegan Body Cream 3oz', revenue: 24.00, margin: 13.40 },
  { date: 'Jul 18', channel: 'Amazon', product: 'Terry Headband — Sage', revenue: 14.99, margin: 4.10 },
  { date: 'Jul 17', channel: 'Walmart', product: 'Silicone Baby Bib', revenue: 12.99, margin: 3.85 },
]
const CHANNEL_HEALTH = [
  { channel: 'Amazon', revenue: 38300, fees: 15.2, aov: 27.40, returns: 4.1 },
  { channel: 'Etsy', revenue: 14900, fees: 9.8, aov: 21.10, returns: 1.9 },
  { channel: 'Shopify', revenue: 12100, fees: 3.1, aov: 31.60, returns: 2.4 },
  { channel: 'Walmart', revenue: 5700, fees: 12.0, aov: 19.80, returns: 3.3 },
]
const CONNECTORS = [
  { group: 'Marketplaces', items: [
    { name: 'Amazon Seller Central', hint: 'OAuth / MWS token', icon: Store },
    { name: 'Etsy Shop Manager', hint: 'OAuth', icon: Store },
    { name: 'Shopify', hint: 'admin API token', icon: Store },
    { name: 'Walmart Marketplace', hint: 'client id + secret', icon: Store },
  ]},
  { group: 'Fulfillment', items: [
    { name: 'Amazon FBA', hint: 'inventory feed', icon: Truck },
    { name: 'ShipStation', hint: 'api key', icon: Truck },
    { name: 'ShipBob', hint: 'OAuth', icon: Truck },
  ]},
  { group: 'Accounting', items: [
    { name: 'QuickBooks', hint: 'OAuth', icon: CreditCard },
    { name: 'Xero', hint: 'OAuth', icon: CreditCard },
    { name: 'A2X', hint: 'api key', icon: CreditCard },
  ]},
  { group: 'AI models', items: [
    { name: 'Anthropic Claude', hint: 'sk-ant-…', icon: Bot },
    { name: 'OpenAI', hint: 'sk-…', icon: Bot },
  ]},
]
const SUGGESTED = [
  'What is my net margin?',
  'What is about to stock out?',
  'Which channel is most profitable?',
  'Why did Amazon fees go up?',
]
// Canned, keyword-matched demo answers — clearly a demo until a real AI key is wired.
function aiReply(q) {
  const s = q.toLowerCase()
  if (s.includes('margin') || s.includes('profit')) return 'Net margin is running ~38% this month ($71K revenue, $44K in COGS + channel fees). Amazon is your thinnest channel at 15.2% fees, Shopify your fattest at 3.1%. (Sample data — connect your channels for live numbers.)'
  if (s.includes('stock') || s.includes('inventory') || s.includes('restock')) return '4 SKUs are below their reorder threshold. The Terry Headband — Sage is the most urgent at 3 units left against a 15-unit threshold on Amazon. (Sample data — connect Seller Central + Etsy for live stock levels.)'
  if (s.includes('channel') || s.includes('profitable') || s.includes('best')) return 'Shopify has the best unit economics (3.1% fees, $31.60 AOV) but Amazon still drives 54% of revenue. Etsy has your lowest return rate at 1.9%. (Sample data — connect your channels.)'
  if (s.includes('fee') || s.includes('amazon')) return 'Amazon fees are ~15.2% of revenue this month, up from 13.8% last month — mostly FBA storage fees ahead of Q4. Worth checking which SKUs are aging in a fulfillment center. (Sample data.)'
  if (s.includes('return')) return 'Blended return rate is 3.1%. Amazon runs hottest at 4.1% — the headband and bib categories account for most of it. (Sample data — connect Seller Central for real return reasons.)'
  if (s.includes('order') || s.includes('revenue')) return 'Revenue is $71K this month, up 12.7% MoM across 4 channels. Amazon and Etsy are both growing; Walmart is flat. (Sample data.)'
  return 'This is a demo assistant answering from sample data. Connect your marketplace accounts in Connectors, plus a Claude or OpenAI key, and I will answer from your real numbers.'
}

function fmt(n) { return '$' + (n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K' : n.toFixed(2).replace(/\\.00$/, '')) }

function SampleTag() {
  return <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">Sample</span>
}

function Sparkline(props) {
  const data = props.data || []
  const w = 72, h = 24
  const min = Math.min.apply(null, data), max = Math.max.apply(null, data), rng = (max - min) || 1
  const pts = data.map((v, i) => ((i / (data.length - 1)) * w).toFixed(1) + ',' + ((h - 2) - ((v - min) / rng) * (h - 4)).toFixed(1)).join(' ')
  const col = props.up === false ? 'hsl(var(--warning))' : 'hsl(var(--primary))'
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Count-up: animates 0 -> value on mount so KPIs feel live.
function AnimatedNumber(props) {
  const [n, setN] = useState(0)
  const target = props.value, dec = props.decimals || 0
  useEffect(() => {
    let raf, start, done = false
    const dur = 750
    const finish = () => { if (!done) { done = true; setN(target) } }
    const step = (t) => {
      if (!start) start = t
      const p = Math.min((t - start) / dur, 1)
      setN(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step); else finish()
    }
    raf = requestAnimationFrame(step)
    const safety = setTimeout(finish, dur + 250)
    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [target])
  return <span>{(props.prefix || '') + n.toFixed(dec) + (props.suffix || '')}</span>
}

function Kpi(props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{props.label}</span>
        <SampleTag />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold tabular-nums leading-none">
          {typeof props.value === 'number'
            ? <AnimatedNumber value={props.value} prefix={props.prefix} suffix={props.suffix} decimals={props.decimals} />
            : props.value}
        </div>
        {props.spark ? <Sparkline data={props.spark} up={!props.down} /> : null}
      </div>
      {props.delta ? (
        <div className={'mt-1.5 flex items-center gap-1 text-xs ' + (props.down ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]')}>
          {props.down ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          <span className="tabular-nums">{props.delta}</span>
        </div>
      ) : null}
    </div>
  )
}

function Panel(props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{props.title}</h3>
          {props.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{props.hint}</p> : null}
        </div>
        <SampleTag />
      </div>
      {props.children}
    </div>
  )
}

const tip = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }
function stockColor(qty, threshold) { return qty <= threshold * 0.25 ? 'text-[hsl(var(--destructive))]' : qty <= threshold * 0.6 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]' }

// ── Views ────────────────────────────────────────────────────────────────────

function Overview(props) {
  return (
    <div className="space-y-6">
      {/* AI morning briefing — proactive, AI-native */}
      <div className="hero-glow rounded-xl border border-primary/20 bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0"><Sparkles className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Your AI briefing</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">generated from sample data</span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90">Good morning, {'{{FIRST_NAME}}'}. Revenue is up 12.7% to $71K this month across 4 channels — but 4 SKUs are below reorder threshold, and the Terry Headband on Amazon has only 3 units left. Amazon fees crept up to 15.2% of revenue while Shopify stayed lean at 3.1% — worth pushing more volume there if you can.</p>
            <button onClick={props.onAsk} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">Ask a follow-up <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Revenue" value={71} prefix="$" suffix="K" delta="12.7% MoM" spark={[41,46,52,58,63,71]} />
        <Kpi label="Net margin" value={38} suffix="%" delta="2 pts" spark={[34,35,36,37,37,38]} />
        <Kpi label="Low-stock SKUs" value={4} delta="2 more" down spark={[1,1,2,2,3,4]} />
        <Kpi label="Blended fees" value={11.4} suffix="%" decimals={1} delta="0.8 pts" down spark={[9.8,10.1,10.6,10.9,11.1,11.4]} />
        <Kpi label="Return rate" value={3.1} suffix="%" decimals={1} delta="flat" spark={[3.0,3.2,3.0,3.1,3.0,3.1]} />
        <Kpi label="Active listings" value={62} delta="+5 MTD" spark={[54,55,57,58,60,62]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="Revenue vs cost" hint="Monthly, last 6 months ($ thousand)">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={REV_COST} margin={{ left: -18, right: 8, top: 6 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} cursor={{ stroke: 'hsl(var(--border))' }} />
                <Area type="monotone" dataKey="rev" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                <Bar dataKey="cost" name="COGS + fees" fill="hsl(218 12% 26%)" radius={[3, 3, 0, 0]} barSize={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title="Revenue by channel" hint="This month">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={CHANNEL_MIX} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                {CHANNEL_MIX.map((e, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Low-stock alerts" hint="Below reorder threshold">
          <div className="space-y-2">
            {LOW_STOCK.map((s) => (
              <div key={s.sku} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm">{s.sku}</div><div className="text-[11px] text-muted-foreground">{s.channel}</div></div>
                <div className="text-right shrink-0"><div className={'text-sm tabular-nums ' + stockColor(s.qty, s.threshold)}>{s.qty} left</div><div className="text-[11px] text-muted-foreground">of {s.threshold} threshold</div></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent orders" hint="Latest across all channels">
          <div className="space-y-2">
            {ORDERS.slice(0, 4).map((o, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm">{o.product}</div><div className="text-[11px] text-muted-foreground">{o.channel} · {o.date}</div></div>
                <span className="shrink-0 text-sm tabular-nums text-[hsl(var(--success))]">{fmt(o.revenue)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="AI alerts" hint="What the assistant flagged this morning">
        <div className="space-y-2">
          {[
            { t: '4 SKUs are below reorder threshold — Terry Headband (Amazon) has only 3 units left', tone: 'destructive' },
            { t: 'Amazon fees climbed to 15.2% of revenue, up from 13.8% last month', tone: 'warning' },
            { t: 'Shopify stays your leanest channel at 3.1% fees — consider steering more traffic there', tone: 'success' },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2.5">
              <Zap className={'mt-0.5 h-4 w-4 shrink-0 ' + (a.tone === 'destructive' ? 'text-[hsl(var(--destructive))]' : a.tone === 'warning' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]')} />
              <span className="text-sm text-foreground/90">{a.t}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function RevenueMargin() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Revenue" value="$71K" delta="12.7% MoM" />
        <Kpi label="Net margin" value="38%" delta="2 pts" />
        <Kpi label="Gross margin" value="61%" delta="flat" />
        <Kpi label="COGS + fees" value="$44K" delta="MTD" />
      </div>
      <Panel title="Margin trend" hint="Revenue vs cost, last 6 months ($ thousand)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={REV_COST} margin={{ left: -18, right: 8, top: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tip} cursor={{ fill: 'hsl(var(--secondary))' }} />
            <Bar dataKey="rev" name="Revenue" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
            <Bar dataKey="cost" name="COGS + fees" fill="hsl(218 12% 26%)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Margin by channel" hint="Fees eat into margin differently per channel">
        <div className="space-y-3">
          {CHANNEL_HEALTH.map((c) => (
            <div key={c.channel} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-sm">{c.channel}</div>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary/70" style={{ width: Math.min(100 - c.fees * 3, 100) + '%' }} /></div>
              <div className="w-20 text-right text-xs tabular-nums text-muted-foreground">{c.fees}% fees</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Inventory() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Active SKUs" value="62" delta="+5 MTD" />
        <Kpi label="Below threshold" value="4" delta="2 more" down />
        <Kpi label="Avg days of stock" value="34" delta="6 fewer" down />
        <Kpi label="Units in FBA" value="1,840" delta="flat" />
      </div>
      <Panel title="Stock levels" hint="Current quantity vs reorder threshold">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2 pr-4 font-medium">SKU</th><th className="py-2 pr-4 font-medium">Channel</th><th className="py-2 pr-4 font-medium">On hand</th><th className="py-2 font-medium">Threshold</th></tr></thead>
            <tbody>
              {LOW_STOCK.map((s) => (
                <tr key={s.sku} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">{s.sku}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{s.channel}</td>
                  <td className={'py-2.5 pr-4 tabular-nums ' + stockColor(s.qty, s.threshold)}>{s.qty}</td>
                  <td className="py-2.5 tabular-nums text-muted-foreground">{s.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Orders() {
  return (
    <Panel title="Recent orders" hint="Every channel, one feed">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="py-2 pr-4 font-medium">Date</th><th className="py-2 pr-4 font-medium">Channel</th><th className="py-2 pr-4 font-medium">Product</th><th className="py-2 pr-4 font-medium">Revenue</th><th className="py-2 font-medium">Margin</th></tr></thead>
          <tbody>
            {ORDERS.map((o, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5 pr-4 text-muted-foreground">{o.date}</td>
                <td className="py-2.5 pr-4">{o.channel}</td>
                <td className="py-2.5 pr-4">{o.product}</td>
                <td className="py-2.5 pr-4 tabular-nums">{fmt(o.revenue)}</td>
                <td className="py-2.5 tabular-nums text-[hsl(var(--success))]">{fmt(o.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Connectors() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <KeyRound className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm font-medium">Connect your channels & AI — this dashboard is fully customizable</div>
          <p className="mt-1 text-xs text-muted-foreground">Wire up your marketplace accounts, fulfillment, accounting and AI model. Once connected, every chart and the AI assistant run on your real numbers. Keys are encrypted and never leave your project.</p>
        </div>
      </div>
      {CONNECTORS.map((grp) => (
        <div key={grp.group}>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{grp.group}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grp.items.map((it) => {
              const Icon = it.icon
              return (
                <div key={it.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{it.name}</div>
                    <input disabled placeholder={it.hint} className="mt-1 w-full rounded border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground placeholder:text-muted-foreground/50" />
                  </div>
                  <button className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/50 hover:text-primary transition-colors">Connect</button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/50'
function Field(props) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{props.label}</span>
      {props.children}
    </label>
  )
}

// ── SHARED CORE tab: seller onboarding. Powers per-seller customization. ─────
function Company() {
  const [saved, setSaved] = useState(false)
  const goals = ['Grow revenue across channels', 'Improve margin / cut fees', 'Reduce stockouts', 'Expand to a new marketplace']
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm font-medium">Tell your dashboard about {'{{COMPANY_NAME}}'}</div>
          <p className="mt-1 text-xs text-muted-foreground">Your AI uses this to tailor the metrics, benchmarks and morning briefing to your business. Fill it in now — it activates the moment you connect your channels.</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true) }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store / brand name"><input placeholder="e.g. Everstock Supply Co." className={inputCls} /></Field>
          <Field label="What you sell"><input placeholder="e.g. home goods, beauty, baby products" className={inputCls} /></Field>
          <Field label="Primary goal"><select className={inputCls}>{goals.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Channels you sell on"><input placeholder="e.g. Amazon, Etsy, Shopify" className={inputCls} /></Field>
          <Field label="Monthly order volume"><input placeholder="e.g. 400–600 orders/mo" className={inputCls} /></Field>
          <Field label="Target monthly revenue"><input placeholder="$100K" className={inputCls} /></Field>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Save profile</button>
            {saved
              ? <span className="text-xs text-[hsl(var(--success))]">Saved — connect your channels to activate.</span>
              : <span className="text-xs text-muted-foreground">Demo — nothing is stored until you start your own project.</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── INDUSTRY MODULE (marketplace sellers). Swap this + a few labels per
//    industry; the rest of the dashboard is shared. ─────────────────────────
function Channels() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CHANNEL_HEALTH.map((c) => (
          <div key={c.channel} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.channel}</span><SampleTag /></div>
            <div className="mt-2 text-lg font-semibold">{fmt(c.revenue)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.fees}% fees · {fmt(c.aov)} AOV</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Return rate by channel" hint="Trailing 30 days">
          <div className="space-y-3">
            {CHANNEL_HEALTH.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">{c.channel}</div>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className={'h-full ' + (c.returns > 3.5 ? 'bg-[hsl(var(--destructive))]' : 'bg-primary/70')} style={{ width: Math.min(c.returns * 12, 100) + '%' }} /></div>
                <div className="w-10 text-right text-xs tabular-nums">{c.returns}%</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Channel notes" hint="What's worth watching">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] mt-0.5 shrink-0" /><span className="text-foreground/90">Amazon fees are your highest at 15.2% — check FBA storage aging.</span></div>
            <div className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" /><span className="text-foreground/90">Shopify has the best margin profile — consider a push there before Q4.</span></div>
            <div className="flex items-start gap-2"><Package className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span className="text-foreground/90">Etsy has your lowest return rate — good candidate for a new SKU launch.</span></div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// INDUSTRY config — the ~10% that varies. Extend with more industries later.
const INDUSTRY = { key: 'seller', moduleTab: { key: 'Channels', icon: Store, view: Channels } }

const NAV = [
  { key: 'Overview', icon: LayoutDashboard, view: Overview },
  { key: 'Revenue & margin', icon: RefreshCw, view: RevenueMargin },
  { key: 'Inventory', icon: Package, view: Inventory },
  INDUSTRY.moduleTab,
  { key: 'Orders', icon: ClipboardList, view: Orders },
  { key: 'Company', icon: Target, view: Company },
  { key: 'Connectors', icon: Plug, view: Connectors },
]

function ChatPanel(props) {
  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 h-14">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Ask your dashboard</span></div>
        <button onClick={props.onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {props.messages.map((m, i) => (
          <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={'max-w-[85%] rounded-lg px-3 py-2 text-sm ' + (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground')}>
              {m.role === 'typing'
                ? <span className="flex items-center gap-1 py-1"><span className="wdot h-1.5 w-1.5 rounded-full bg-muted-foreground" /><span className="wdot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: '0.15s' }} /><span className="wdot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: '0.3s' }} /></span>
                : m.text}
            </div>
          </div>
        ))}
        {props.messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground pt-6">
            <Bot className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            Ask about margin, stock, channels or orders.
            <div className="mt-1 text-[11px] text-muted-foreground/70">Demo answers from sample data — connect your Claude/OpenAI key for live analysis.</div>
          </div>
        ) : null}
      </div>
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => props.onSend(s)} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (props.input.trim()) props.onSend(props.input) }} className="flex items-center gap-2">
          <input value={props.input} onChange={(e) => props.onInput(e.target.value)} placeholder="Ask anything…" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50" />
          <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('Overview')
  const [chatOpen, setChatOpen] = useState(true)
  const [banner, setBanner] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [toast, setToast] = useState('')

  function notify(msg) { setToast(msg); setTimeout(() => setToast(''), 2600) }

  function send(text) {
    setInput('')
    setChatOpen(true)
    setMessages((m) => m.concat([{ role: 'user', text }, { role: 'typing' }]))
    setTimeout(() => {
      setMessages((m) => {
        const copy = m.slice()
        for (let i = copy.length - 1; i >= 0; i--) { if (copy[i].role === 'typing') { copy[i] = { role: 'ai', text: aiReply(text) }; break } }
        return copy
      })
    }, 700)
  }

  const View = (NAV.find((n) => n.key === tab) || NAV[0]).view

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border min-h-screen sticky top-0">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">{'{{BRAND_INITIAL}}'}</div>
            <div className="min-w-0"><div className="truncate text-sm font-medium">{'{{COMPANY_NAME}}'}</div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Seller Command Center</div></div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon; const active = item.key === tab
              return (
                <button key={item.key} onClick={() => setTab(item.key)} className={'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ' + (active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}>
                  <Icon className="h-4 w-4" />{item.key}
                </button>
              )
            })}
          </nav>
          <div className="p-3">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 text-xs"><Store className="h-3.5 w-3.5 text-primary" /> AI-native · built with WyberAi</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Fully customizable. Connect your channels to go live.</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {banner ? (
            <div className="flex items-center justify-between gap-3 bg-primary/10 border-b border-primary/20 px-5 py-2 text-xs">
              <div className="flex items-center gap-2 text-[hsl(var(--accent-foreground))]"><Sparkles className="h-3.5 w-3.5" /> This is a live, fully-customizable AI-native dashboard with sample data — connect your marketplace accounts & AI key to make it yours.</div>
              <button onClick={() => setBanner(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : null}

          <div className="flex flex-1 min-h-0">
            <main className="flex-1 min-w-0">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 sm:px-8 py-3 sm:h-16 sticky top-0 bg-background/80 backdrop-blur z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">{'{{BRAND_INITIAL}}'}</span>
                    <h1 className="font-display text-lg sm:text-xl font-semibold">Morning, {'{{FIRST_NAME}}'} 👋</h1>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{'{{COMPANY_NAME}}'} · margin, inventory & orders at a glance <span className="font-mono">· sample data</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => notify('Preparing your report… (demo — connect your channels to export live)')} className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50 hover:text-primary transition-colors">
                    <FileDown className="h-4 w-4" /> Export
                  </button>
                  <button onClick={() => setChatOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50 hover:text-primary transition-colors">
                    <Sparkles className="h-4 w-4" /> Ask AI
                  </button>
                  <button onClick={() => setTab('Connectors')} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Connect your channels</button>
                </div>
              </header>

              <div className="p-5 sm:p-8 space-y-6">
                {/* Mobile tab strip */}
                <div className="lg:hidden -mx-5 px-5 overflow-x-auto"><div className="flex gap-2 w-max">
                  {NAV.map((item) => (
                    <button key={item.key} onClick={() => setTab(item.key)} className={'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ' + (item.key === tab ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{item.key}</button>
                  ))}
                </div></div>

                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <View onAsk={() => setChatOpen(true)} />
                </motion.div>

                {/* Footer CTA — one shared demo, not per-lead, so this links straight to
                   signup rather than a personalized claim link. */}
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-[hsl(var(--accent-foreground))]"><Sparkles className="h-3.5 w-3.5" /> A sample of what you'd get · fully customizable</div>
                  <h2 className="mt-4 font-display text-xl sm:text-2xl font-semibold">Get a dashboard like this for your own store.</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Sign up and build this exact AI-native seller dashboard in your own WyberAi project — ready to customize. Connect your marketplace accounts and AI key and it runs on your real numbers. Starts at just <span className="text-foreground font-medium">50 free credits</span>.</p>
                  <a href="https://wyberai.com/signup" className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"><ChevronRight className="h-4 w-4" /> Start building free — 50 credits</a>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">All figures shown are sample placeholders</p>
                </div>
              </div>
            </main>

            {/* AI chat panel */}
            <AnimatePresence>
              {chatOpen ? (
                <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="hidden md:block shrink-0 sticky top-0 h-screen overflow-hidden">
                  <div className="w-[340px] h-full"><ChatPanel messages={messages} input={input} onInput={setInput} onSend={send} onClose={() => setChatOpen(false)} /></div>
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile chat toggle + sheet */}
      {!chatOpen ? (
        <button onClick={() => setChatOpen(true)} className="md:hidden fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"><Sparkles className="h-5 w-5" /></button>
      ) : (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <ChatPanel messages={messages} input={input} onInput={setInput} onSend={send} onClose={() => setChatOpen(false)} />
        </div>
      )}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] rounded-md border border-border bg-popover px-4 py-2 text-sm text-center shadow-lg">{toast}</div>
      ) : null}
    </div>
  )
}`

export const SELLER_COCKPIT_FILES: Record<string, string> = {
  'index.html': INDEX_HTML,
  'src/main.tsx': MAIN_TSX,
  'src/index.css': INDEX_CSS,
  'src/App.tsx': APP_TSX,
}
