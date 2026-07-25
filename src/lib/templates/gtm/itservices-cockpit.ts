// GTM demo template #3: an AI-native "Revenue & Delivery Command Center" for
// small IT-services / software dev-shop founders (India segment). Same stamp
// engine as the security + dev-shop templates (clone -> replace tokens ->
// publish to a free slug -> claim on signup). This is the security-cockpit
// base (its INDUSTRY module was built swappable on purpose) with the
// security-specific ~10% replaced by delivery/bench/receivables content
// pulled from the original devshop-cockpit template.
//
// HONESTY CONTRACT (do not weaken): all numbers are sample placeholders and are
// marked as such; the whole thing is presented as a fully-customizable demo, not
// as the founder's real data. Only first name + company are personalized.

export const ITSERVICES_COCKPIT_TOKENS = ['{{COMPANY_NAME}}', '{{FIRST_NAME}}', '{{BRAND_INITIAL}}', '{{CLAIM_URL}}'] as const

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{COMPANY_NAME}} · Command Center</title>
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
  LayoutDashboard, RefreshCw, Wallet, Megaphone, TrendingUp, Users, Plug,
  Sparkles, Send, X, ArrowUpRight, ArrowDownRight, FolderKanban, Bot,
  Database, KeyRound, Building2, CreditCard, ChevronRight, Zap,
  FileDown, ArrowRight, Target, Timer, TriangleAlert,
} from 'lucide-react'

// ── Everything below is SAMPLE data. Nothing here is the founder's real data. ──

const REV_SPEND = [
  { m: 'Feb', rev: 148, spend: 96 }, { m: 'Mar', rev: 162, spend: 104 },
  { m: 'Apr', rev: 171, spend: 118 }, { m: 'May', rev: 189, spend: 121 },
  { m: 'Jun', rev: 206, spend: 133 }, { m: 'Jul', rev: 224, spend: 141 },
]
const SPEND_MIX = [
  { name: 'Delivery / bench', value: 52 }, { name: 'Sales & marketing', value: 28 },
  { name: 'Tools & infra', value: 12 }, { name: 'G&A', value: 8 },
]
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(199 80% 65%)', 'hsl(199 40% 45%)', 'hsl(218 12% 30%)']
const RENEWALS = [
  { client: 'Acme Retail', arr: 84000, days: 12, risk: 'high' },
  { client: 'FinBox', arr: 56000, days: 27, risk: 'med' },
  { client: 'Kite Labs', arr: 42000, days: 41, risk: 'low' },
  { client: 'Zeal Health', arr: 38000, days: 63, risk: 'low' },
]
const CAMPAIGNS = [
  { name: 'LinkedIn — founder outbound', spend: 6200, pipeline: 84000, roi: 13.5 },
  { name: 'Clutch / GoodFirms listing', spend: 3400, pipeline: 51000, roi: 15.0 },
  { name: 'Referral partner program', spend: 2000, pipeline: 46000, roi: 23.0 },
  { name: 'Google — service intent ads', spend: 9200, pipeline: 41000, roi: 4.5 },
  { name: 'Case-study webinar', spend: 1500, pipeline: 18000, roi: 12.0 },
]
const PIPELINE = [
  { stage: 'Discovery', v: 620 }, { stage: 'Scoping call', v: 410 },
  { stage: 'Proposal sent', v: 260 }, { stage: 'Contract', v: 180 }, { stage: 'Closed won', v: 95 },
]
const CLIENTS = [
  { name: 'Acme Retail', arr: 84000, seats: 6, health: 'At risk', renew: 'Jul 28' },
  { name: 'FinBox', arr: 56000, seats: 4, health: 'Healthy', renew: 'Aug 12' },
  { name: 'Kite Labs', arr: 42000, seats: 3, health: 'Healthy', renew: 'Aug 26' },
  { name: 'Zeal Health', arr: 38000, seats: 2, health: 'Expanding', renew: 'Sep 17' },
  { name: 'Nova CRM (in-house)', arr: 29000, seats: 5, health: 'Healthy', renew: 'Oct 03' },
]
const BENCH = [
  { name: 'Aarav S.', role: 'Sr. Backend', alloc: 120, tag: 'over' },
  { name: 'Meera K.', role: 'Frontend', alloc: 95, tag: 'ok' },
  { name: 'Rohit P.', role: 'Mobile', alloc: 40, tag: 'idle' },
  { name: 'Sana R.', role: 'QA', alloc: 20, tag: 'idle' },
  { name: 'Dev M.', role: 'DevOps', alloc: 88, tag: 'ok' },
]
const PROJECTS = [
  { name: 'Nova CRM revamp', client: 'Acme Retail', status: 'On track' },
  { name: 'Payments SDK', client: 'FinBox', status: 'At risk' },
  { name: 'Analytics portal', client: 'Kite Labs', status: 'On track' },
  { name: 'Onboarding app', client: 'Zeal Health', status: 'Slipping' },
]
const AGING = [
  { bucket: '0–30d', amt: 14.2 }, { bucket: '31–60d', amt: 11.8 },
  { bucket: '61–90d', amt: 9.1 }, { bucket: '90d+', amt: 7.5 },
]
const CONNECTORS = [
  { group: 'AI models', items: [
    { name: 'Anthropic Claude', hint: 'sk-ant-…', icon: Bot },
    { name: 'OpenAI', hint: 'sk-…', icon: Bot },
  ]},
  { group: 'Project & delivery', items: [
    { name: 'Jira', hint: 'OAuth', icon: FolderKanban },
    { name: 'GitHub', hint: 'personal access token', icon: Database },
    { name: 'Toggl', hint: 'api token', icon: Timer },
  ]},
  { group: 'CRM & GTM', items: [
    { name: 'HubSpot', hint: 'private app token', icon: Building2 },
    { name: 'Apollo', hint: 'api key', icon: Building2 },
  ]},
  { group: 'Billing & finance', items: [
    { name: 'Zoho Books', hint: 'OAuth', icon: CreditCard },
    { name: 'Razorpay', hint: 'api key', icon: CreditCard },
    { name: 'QuickBooks', hint: 'OAuth', icon: CreditCard },
  ]},
]
const SUGGESTED = [
  'What is my runway?',
  'Which engagement has the best margin?',
  'Which renewals are at risk?',
  'Who is idle on the bench?',
]
// Canned, keyword-matched demo answers — clearly a demo until a real AI key is wired.
function aiReply(q) {
  const s = q.toLowerCase()
  if (s.includes('runway') || s.includes('burn') || s.includes('cash')) return 'At $141K/mo spend against $224K/mo revenue you are cash-flow positive on paper; on the $2.1M bank balance that is ~15 months of buffer if revenue stalled. (Sample data — connect Razorpay + Zoho Books for live numbers.)'
  if (s.includes('margin') || s.includes('roi') || s.includes('engagement') || s.includes('campaign')) return 'Best ROI is the referral partner program (23x, $2K -> $46K pipeline) — cheapest channel you have and it is barely funded. Google service-intent ads are your weakest at 4.5x. (Sample data — connect your ad + CRM accounts.)'
  if (s.includes('renew') || s.includes('churn') || s.includes('risk')) return '3 renewals worth $182K land in the next 41 days. Acme Retail ($84K) is high-risk and renews in 12 days with no check-in logged. (Sample data — connect your CRM.)'
  if (s.includes('idle') || s.includes('bench') || s.includes('utilization') || s.includes('allocation')) return '2 developers have been on the bench 3+ weeks — Rohit (Mobile, 40% alloc) and Sana (QA, 20% alloc). That is billable capacity going unused; either resell it or reallocate to a project that is slipping. (Sample data — connect Jira + Toggl.)'
  if (s.includes('arr') || s.includes('revenue') || s.includes('mrr')) return 'ARR is $2.69M, up 8.7% MoM, with net revenue retention at 112%. Expansion at Zeal Health is the main driver. (Sample data.)'
  if (s.includes('spend') || s.includes('cost')) return 'This month: Delivery/bench $52K, Sales & marketing $28K, Tools & infra $12K, G&A $8K. Delivery cost is 52% of spend — the bench idle time above is your biggest lever there. (Sample data — connect QuickBooks/Razorpay.)'
  return 'This is a demo assistant answering from sample data. Connect your Claude or OpenAI key in Connectors, plus your database and project tools, and I will answer from your real numbers.'
}

function fmt(n) { return '$' + (n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K' : String(n)) }

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
function riskColor(r) { return r === 'high' ? 'text-[hsl(var(--destructive))]' : r === 'med' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]' }
function healthBadge(h) {
  const c = h === 'At risk' ? 'text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10'
    : h === 'Expanding' ? 'text-[hsl(var(--primary))] border-primary/30 bg-primary/10'
    : 'text-[hsl(var(--success))] border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10'
  return 'rounded-full border px-2 py-0.5 text-[11px] ' + c
}
function statusColor(s) {
  if (s === 'On track') return 'text-[hsl(var(--success))] border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10'
  if (s === 'At risk') return 'text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10'
  return 'text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10'
}
function allocColor(tag) {
  if (tag === 'over') return 'bg-[hsl(var(--warning))]'
  if (tag === 'idle') return 'bg-[hsl(var(--destructive))]'
  return 'bg-primary'
}

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
            <p className="mt-1.5 text-sm text-foreground/90">Good morning, {'{{FIRST_NAME}}'}. Revenue is up 8.7% to $2.69M ARR — but 3 renewals worth $182K land in 41 days and Acme Retail ($84K) looks shaky with no check-in logged. Two developers have been idle on the bench for 3+ weeks while your referral program quietly returns 23x on almost no spend.</p>
            <button onClick={props.onAsk} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">Ask a follow-up <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="ARR" value={2.69} prefix="$" suffix="M" decimals={2} delta="8.7% MoM" spark={[2.1,2.2,2.25,2.4,2.5,2.6,2.69]} />
        <Kpi label="Net retention" value={112} suffix="%" delta="3 pts" spark={[104,106,108,109,110,111,112]} />
        <Kpi label="Billable utilization" value={78} suffix="%" delta="4.2 pts" spark={[68,70,72,74,76,77,78]} />
        <Kpi label="Renewals ≤90d" value={220} prefix="$" suffix="K" delta="4 accounts" down spark={[120,140,160,180,200,210,220]} />
        <Kpi label="Devs on bench" value={2} delta="1 fewer" spark={[4,4,3,3,2,2,2]} />
        <Kpi label="Runway" value={15} suffix=" mo" delta="stable" spark={[16,16,15,15,15,15,15]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="Revenue vs spend" hint="Monthly, last 6 months ($ thousand)">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={REV_SPEND} margin={{ left: -18, right: 8, top: 6 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} cursor={{ stroke: 'hsl(var(--border))' }} />
                <Area type="monotone" dataKey="rev" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                <Bar dataKey="spend" name="Spend" fill="hsl(218 12% 26%)" radius={[3, 3, 0, 0]} barSize={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title="Spend breakdown" hint="This month by function">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={SPEND_MIX} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                {SPEND_MIX.map((e, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Bench & allocation" hint="Idle capacity is the #1 margin leak">
          <div className="space-y-3">
            {BENCH.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <div className="text-sm text-foreground">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.role}</div>
                </div>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={'h-full ' + allocColor(d.tag)} style={{ width: Math.min(d.alloc, 100) + '%' }} />
                </div>
                <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">{d.alloc}%</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Cash & runway" hint="Burn vs balance">
          <div className="text-3xl font-semibold tabular-nums">15<span className="text-base text-muted-foreground"> months</span></div>
          <div className="mt-1 text-xs text-muted-foreground">$2.1M in bank · ~$141K/mo net burn</div>
          <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary" style={{ width: '62%' }} /></div>
          <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground"><span>now</span><span>runway ends ~Oct 2027</span></div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Upcoming renewals" hint="Next 90 days — revenue to defend">
          <div className="space-y-2">
            {RENEWALS.map((r) => (
              <div key={r.client} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                <div><div className="text-sm">{r.client}</div><div className="text-[11px] text-muted-foreground">{fmt(r.arr)} ARR</div></div>
                <div className="text-right"><div className={'text-sm tabular-nums ' + riskColor(r.risk)}>{r.days}d</div><div className="text-[11px] text-muted-foreground">{r.risk} risk</div></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Top channels" hint="Spend → pipeline → ROI">
          <div className="space-y-2">
            {CAMPAIGNS.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm">{c.name}</div><div className="text-[11px] text-muted-foreground">{fmt(c.spend)} → {fmt(c.pipeline)}</div></div>
                <span className="shrink-0 text-sm tabular-nums text-[hsl(var(--success))]">{c.roi}x</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="AI alerts" hint="What the assistant flagged this morning">
        <div className="space-y-2">
          {[
            { t: '3 renewals worth $182K due in 41 days — Acme Retail ($84K) has no check-in logged', tone: 'destructive' },
            { t: '2 developers on the bench 3+ weeks — reallocate or bill before it becomes a margin problem', tone: 'warning' },
            { t: 'Referral program is your best channel at 23x ROI on almost no spend — consider funding it properly', tone: 'success' },
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

function Renewals() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="ARR" value="$2.69M" delta="8.7% MoM" />
        <Kpi label="Net retention" value="112%" />
        <Kpi label="Gross churn" value="4.1%" delta="0.6 pts" down />
        <Kpi label="Expansion ARR" value="$61K" delta="MTD" />
      </div>
      <Panel title="ARR movement" hint="New / expansion / churn ($ thousand)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[{ m: 'Apr', nw: 42, ex: 18, ch: -9 }, { m: 'May', nw: 51, ex: 22, ch: -12 }, { m: 'Jun', nw: 47, ex: 31, ch: -8 }, { m: 'Jul', nw: 58, ex: 61, ch: -14 }]} margin={{ left: -18, right: 8, top: 6 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tip} cursor={{ fill: 'hsl(var(--secondary))' }} />
            <Bar dataKey="nw" name="New" stackId="a" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
            <Bar dataKey="ex" name="Expansion" stackId="a" fill="hsl(199 70% 62%)" />
            <Bar dataKey="ch" name="Churn" stackId="a" fill="hsl(var(--destructive))" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Renewal calendar" hint="Accounts up for renewal, soonest first">
        <div className="space-y-2">
          {RENEWALS.map((r) => (
            <div key={r.client} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
              <div><div className="text-sm">{r.client}</div><div className="text-[11px] text-muted-foreground">{fmt(r.arr)} ARR</div></div>
              <div className="flex items-center gap-3"><span className={'text-xs ' + riskColor(r.risk)}>{r.risk} risk</span><span className="text-sm tabular-nums text-muted-foreground">{r.days}d</span></div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Spend() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Monthly spend" value="$141K" delta="6% MoM" down />
        <Kpi label="vs budget" value="+4%" delta="over" down />
        <Kpi label="Largest line" value="Delivery $52K" />
        <Kpi label="Cloud / infra" value="$11.2K" delta="flat" />
      </div>
      <Panel title="Spend trend" hint="Total monthly spend ($ thousand)">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={REV_SPEND} margin={{ left: -18, right: 8, top: 6 }}>
            <defs><linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(199 70% 55%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(199 70% 55%)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tip} />
            <Area type="monotone" dataKey="spend" stroke="hsl(199 70% 55%)" strokeWidth={2} fill="url(#sp)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Top vendors" hint="Where the money goes">
        <div className="space-y-3">
          {[['AWS', 11200], ['Jira', 2400], ['LinkedIn Ads', 6200], ['Figma', 1200], ['Zoho Books', 900]].map(([v, amt]) => (
            <div key={v} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm">{v}</div>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary/70" style={{ width: Math.min(amt / 185, 100) + '%' }} /></div>
              <div className="w-16 text-right text-xs tabular-nums text-muted-foreground">{fmt(amt)}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Marketing() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Marketing spend" value="$22K" delta="MTD" />
        <Kpi label="Pipeline created" value="$240K" delta="12% MoM" />
        <Kpi label="Blended ROI" value="11.9x" />
        <Kpi label="Lead → proposal" value="34%" delta="2 pts" />
      </div>
      <Panel title="Channel performance" hint="Where new engagements actually come from">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2 pr-4 font-medium">Channel</th><th className="py-2 pr-4 font-medium">Spend</th><th className="py-2 pr-4 font-medium">Pipeline</th><th className="py-2 font-medium">ROI</th></tr></thead>
            <tbody>
              {CAMPAIGNS.map((c) => (
                <tr key={c.name} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">{c.name}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">{fmt(c.spend)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{fmt(c.pipeline)}</td>
                  <td className={'py-2.5 tabular-nums ' + (c.roi >= 8 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]')}>{c.roi}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Sales() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Open pipeline" value="$620K" delta="9% MoM" />
        <Kpi label="Win rate" value="31%" delta="1 pt" />
        <Kpi label="Sales cycle" value="24 days" delta="4 fewer" />
        <Kpi label="Avg deal size" value="$38K" delta="stable" />
      </div>
      <Panel title="Pipeline by stage" hint="From first call to signed contract ($ thousand)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={PIPELINE} layout="vertical" margin={{ left: 40, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
            <Tooltip contentStyle={tip} cursor={{ fill: 'hsl(var(--secondary))' }} />
            <Bar dataKey="v" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}

function Clients() {
  return (
    <Panel title="Existing clients" hint="Accounts, ARR, active seats, renewal, health">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="py-2 pr-4 font-medium">Client</th><th className="py-2 pr-4 font-medium">ARR</th><th className="py-2 pr-4 font-medium">Pod size</th><th className="py-2 pr-4 font-medium">Renews</th><th className="py-2 font-medium">Health</th></tr></thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr key={c.name} className="border-b border-border/50">
                <td className="py-2.5 pr-4">{c.name}</td>
                <td className="py-2.5 pr-4 tabular-nums">{fmt(c.arr)}</td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">{c.seats}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">{c.renew}</td>
                <td className="py-2.5"><span className={healthBadge(c.health)}>{c.health}</span></td>
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
          <div className="text-sm font-medium">Connect your data & AI — this dashboard is fully customizable</div>
          <p className="mt-1 text-xs text-muted-foreground">Wire up your own AI model, project tools, and CRM keys. Once connected, every chart and the AI assistant run on your real numbers. Keys are encrypted and never leave your project.</p>
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

// ── SHARED CORE tab: company onboarding. Powers per-founder customization. ─────
function Company() {
  const [saved, setSaved] = useState(false)
  const goals = ['Grow ARR', 'Reduce bench idle time', 'Improve net retention', 'Raise a round']
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm font-medium">Tell your dashboard about {'{{COMPANY_NAME}}'}</div>
          <p className="mt-1 text-xs text-muted-foreground">Your AI uses this to tailor the metrics, benchmarks and morning briefing to your goals. Fill it in now — it activates the moment you connect your data.</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true) }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company website"><input placeholder="https://…" className={inputCls} /></Field>
          <Field label="One-line description"><input placeholder="What you build, in a sentence" className={inputCls} /></Field>
          <Field label="Primary goal"><select className={inputCls}>{goals.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Ideal client"><input placeholder="e.g. Shopify brands needing custom apps" className={inputCls} /></Field>
          <Field label="Main competitors"><input placeholder="Comma-separated" className={inputCls} /></Field>
          <Field label="Target ARR (12 mo)"><input placeholder="$1M" className={inputCls} /></Field>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Save profile</button>
            {saved
              ? <span className="text-xs text-[hsl(var(--success))]">Saved — connect your data to activate.</span>
              : <span className="text-xs text-muted-foreground">Demo — nothing is stored until you claim this app.</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── INDUSTRY MODULE (delivery). Swapped in place of the security-cockpit's
//    Compliance tab — same swappable-module architecture, new industry. ────────
function Delivery() {
  return (
    <div className="space-y-4">
      <Panel title="Project delivery health" hint="Across active client engagements">
        <div className="space-y-2">
          {PROJECTS.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm text-foreground">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">{p.client}</div>
              </div>
              <span className={'shrink-0 rounded-full border px-2 py-0.5 text-[11px] ' + statusColor(p.status)}>{p.status}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Receivables aging" hint="$42.6K outstanding — $7.5K over 90 days">
          <div className="space-y-3">
            {AGING.map((a) => (
              <div key={a.bucket} className="flex items-center gap-3">
                <div className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">{a.bucket}</div>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: (a.amt / 14.2 * 100) + '%' }} />
                </div>
                <div className="w-16 text-right text-xs tabular-nums text-foreground">\${a.amt}K</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Bench alerts" hint="What would need your attention this week">
          <div className="space-y-2">
            {[
              { icon: Timer, text: '2 developers on bench for 3+ weeks — reallocate or bill', tone: 'warning' },
              { icon: Wallet, text: 'Acme Retail invoice #INV-204 is 45 days overdue ($6.2K)', tone: 'destructive' },
              { icon: TriangleAlert, text: 'Onboarding app is slipping — 3 tasks blocked over 5 days', tone: 'destructive' },
            ].map((a, i) => {
              const Icon = a.icon
              const tone = a.tone === 'destructive' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--warning))]'
              return (
                <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                  <Icon className={'mt-0.5 h-4 w-4 shrink-0 ' + tone} />
                  <span className="text-sm text-foreground/90">{a.text}</span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// INDUSTRY config — the ~10% that varies between verticals sharing this base.
const INDUSTRY = { key: 'itservices', moduleTab: { key: 'Delivery', icon: FolderKanban, view: Delivery } }

const NAV = [
  { key: 'Overview', icon: LayoutDashboard, view: Overview },
  { key: 'Revenue & renewals', icon: RefreshCw, view: Renewals },
  { key: 'Spend', icon: Wallet, view: Spend },
  { key: 'Marketing', icon: Megaphone, view: Marketing },
  { key: 'Sales', icon: TrendingUp, view: Sales },
  { key: 'Clients', icon: Users, view: Clients },
  INDUSTRY.moduleTab,
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
            Ask about revenue, bench, renewals or channels.
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
            <div className="min-w-0"><div className="truncate text-sm font-medium">{'{{COMPANY_NAME}}'}</div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Command Center</div></div>
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
              <div className="flex items-center gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI-native · built with WyberAi</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Fully customizable. Connect your data to go live.</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {banner ? (
            <div className="flex items-center justify-between gap-3 bg-primary/10 border-b border-primary/20 px-5 py-2 text-xs">
              <div className="flex items-center gap-2 text-[hsl(var(--accent-foreground))]"><Sparkles className="h-3.5 w-3.5" /> This is a live, fully-customizable AI-native dashboard with sample data — connect your AI keys, project tools & CRM to make it yours.</div>
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
                  <p className="text-xs text-muted-foreground mt-0.5">{'{{COMPANY_NAME}}'} · revenue & delivery at a glance <span className="font-mono">· sample data</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => notify('Preparing your board report… (demo — connect your data to export live)')} className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50 hover:text-primary transition-colors">
                    <FileDown className="h-4 w-4" /> Export
                  </button>
                  <button onClick={() => setChatOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50 hover:text-primary transition-colors">
                    <Sparkles className="h-4 w-4" /> Ask AI
                  </button>
                  <button onClick={() => setTab('Connectors')} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Connect your data</button>
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

                {/* Footer CTA */}
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-[hsl(var(--accent-foreground))]"><Sparkles className="h-3.5 w-3.5" /> Made for {'{{COMPANY_NAME}}'} · fully customizable</div>
                  <h2 className="mt-4 font-display text-xl sm:text-2xl font-semibold">Get this dashboard in your own project, {'{{FIRST_NAME}}'}.</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Sign up and this exact AI-native dashboard lands in your WyberAi project — ready to customize and use. Connect your AI keys, project tools and CRM and it runs on your real numbers. Starts at just <span className="text-foreground font-medium">50 credits</span>.</p>
                  <a href="{{CLAIM_URL}}" className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"><ChevronRight className="h-4 w-4" /> Sign up & customize — 50 credits</a>
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

export const ITSERVICES_COCKPIT_FILES: Record<string, string> = {
  'index.html': INDEX_HTML,
  'src/main.tsx': MAIN_TSX,
  'src/index.css': INDEX_CSS,
  'src/App.tsx': APP_TSX,
}
