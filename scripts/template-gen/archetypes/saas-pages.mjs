// Page-level builders for the saas-shell archetype — Login, Dashboard,
// Analytics, Notifications, Settings, and the primary feature (data table)
// page, matching src/app/api/generate/route.ts's per-page specs (DASHBOARD,
// ANALYTICS, DATA TABLE PAGE, SETTINGS sections) as closely as a
// deterministic (non-AI) generator reasonably can.

function esc(s) { return String(s).replace(/'/g, "\\'") }

// Real product spec: "AUTH SCREEN LEFT PANEL IS NON-NEGOTIABLE... a CINEMATIC
// BRAND IMAGE... NOT a logo on gradient." Derived from the app's own
// tagline/name — art-directed, not a generic placeholder.
function authImagePrompt(config) {
  return `hyperrealistic dark 3D abstract atmosphere evoking ${config.tagline.toLowerCase()}, for ${config.appName}, cinematic depth of field, ultra-sharp render`
}

function authImagePanel(config, quote, quoteRole) {
  return `<div className="relative hidden overflow-hidden md:block grain">
        <img
          src="{{wyber-image: ${authImagePrompt(config)} | 9:16}}"
          alt="${esc(config.appName)} brand atmosphere"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />
        <div className="relative z-10 p-8">
          <span className="font-display text-lg font-bold tracking-tight text-white">${esc(config.appName)}</span>
        </div>
        <div className="relative z-10 mt-auto flex h-full flex-col justify-end p-12">
          <p className="max-w-xs font-display text-2xl font-semibold leading-snug tracking-tight text-white/90">${quote}</p>
          <p className="mt-3 text-sm text-white/50">${esc(quoteRole)}</p>
        </div>
      </div>`
}

export function loginFile(config) {
  return `import { useState } from 'react'
import { Button, Input } from '../../wyber-ui'
import { useAuth } from '../../contexts/AuthContext'
import { navigate } from '../../hooks/useHashRoute'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e) => {
    e.preventDefault()
    login(email || 'you@example.com')
    navigate('/dashboard')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-16">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">${config.appName.charAt(0)}</div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">${config.appName}</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">${config.tagline}</p>

          <div className="mt-8 flex flex-col gap-4">
            <button type="button" onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@firm.com" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">Password</label>
                <a href="#/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full">Sign in</Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            No account? <a href="#/signup" className="text-primary hover:underline">Create one</a>
          </p>
        </form>
      </div>
      ${authImagePanel(config, config.loginQuote || 'Everything your practice runs on, in one place.', `${config.appName} — ${config.tagline}`)}
    </div>
  )
}
`
}

export function signupFile(config) {
  return `import { useMemo, useState } from 'react'
import { Button, Input } from '../../wyber-ui'
import { useAuth } from '../../contexts/AuthContext'
import { navigate } from '../../hooks/useHashRoute'

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-primary', 'bg-success']

export default function Signup() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const strength = useMemo(() => passwordStrength(password), [password])

  const submit = (e) => {
    e.preventDefault()
    if (!agreed) return
    login(email || 'you@example.com')
    navigate('${config.archetype === 'webapp' ? '/dashboard' : '/onboarding'}')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-16">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">${config.appName.charAt(0)}</div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">${config.appName}</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">${config.tagline}</p>

          <div className="mt-8 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Lee" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@firm.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={'h-1 flex-1 rounded-full ' + (i < strength ? STRENGTH_COLOR[strength] : 'bg-muted')} />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{STRENGTH_LABEL[strength]}</p>
                </div>
              )}
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5" />
              <span>I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</span>
            </label>
          </div>

          <Button type="submit" className="mt-6 w-full">Create account</Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account? <a href="#/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </form>
      </div>
      ${authImagePanel(config, `Switched to ${config.appName}. Best decision this quarter.`, 'Sarah Chen — Head of Ops')}
    </div>
  )
}
`
}

export function forgotPasswordFile(config) {
  return `import { useState } from 'react'
import { Button, Input } from '../../wyber-ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">${config.appName.charAt(0)}</div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">${config.appName}</span>
          </div>
          {sent ? (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">We sent a password reset link to <span className="text-foreground">{email}</span>. It expires in 1 hour.</p>
              <a href="#/login" className="mt-6 inline-block text-sm text-primary hover:underline">Back to sign in</a>
            </>
          ) : (
            <form onSubmit={submit}>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <div className="mt-8">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@firm.com" />
              </div>
              <Button type="submit" className="mt-6 w-full">Send reset link</Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Remembered it? <a href="#/login" className="text-primary hover:underline">Sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
      ${authImagePanel(config, 'Back in one click.', `${config.appName} — ${config.tagline}`)}
    </div>
  )
}
`
}

export function onboardingFile(config) {
  const featureLabel = esc(config.primaryFeatureLabel.toLowerCase())
  return `import { useState } from 'react'
import { Button, Input } from '../../wyber-ui'
import { navigate } from '../../hooks/useHashRoute'
import { useOrg } from '../../contexts/OrgContext'

const ROLES = [
  { id: 'owner', label: 'Founder / Owner', detail: 'Full access to everything' },
  { id: 'admin', label: 'Operations', detail: 'Manages day-to-day workflow' },
  { id: 'member', label: 'Team member', detail: 'Works within assigned records' },
]

const STEPS = ['Workspace', 'Your role', 'Import data', 'Invite team', 'Done']

export default function Onboarding() {
  const { switchOrg, switchRole } = useOrg()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('${esc(config.appName)}')
  const [companySize, setCompanySize] = useState('2-10')
  const [role, setRole] = useState('owner')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invited, setInvited] = useState([])

  const next = () => {
    if (step === 0) switchOrg({ id: '1', name: workspaceName, slug: workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), plan: 'pro' })
    if (step === 1) switchRole(role)
    if (step === STEPS.length - 1) { navigate('/dashboard'); return }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  const addInvite = () => {
    if (!inviteEmail.trim()) return
    setInvited(v => [...v, inviteEmail.trim()])
    setInviteEmail('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={'h-1 flex-1 rounded-full ' + (i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Name your workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">This is where all your ${featureLabel} will live — you can invite your team here next.</p>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Workspace name</label>
                <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company size</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2-10', '11-50', '50+'].map(s => (
                    <button key={s} type="button" onClick={() => setCompanySize(s)}
                      className={'rounded-lg border px-3 py-2 text-sm font-medium transition-colors ' + (companySize === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">What's your role?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">This shapes what your dashboard shows by default.</p>
            <div className="mt-6 flex flex-col gap-2">
              {ROLES.map(r => (
                <button key={r.id} type="button" onClick={() => setRole(r.id)}
                  className={'rounded-lg border p-4 text-left transition-colors ' + (role === r.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent')}>
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Import your existing data</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Bring in your current ${featureLabel} from a spreadsheet, or start fresh — you can always import later from Settings.</p>
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Drag a CSV here, or</p>
              <Button variant="outline" size="sm" className="mt-3">Browse files</Button>
            </div>
            <button type="button" onClick={next} className="mt-3 text-xs text-muted-foreground hover:text-foreground">Skip for now — I'll add ${featureLabel} manually</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Invite your team</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">They'll get access as soon as they accept — you can change roles anytime in Settings.</p>
            <div className="mt-6 flex gap-2">
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@firm.com" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInvite())} />
              <Button type="button" variant="outline" onClick={addInvite}>Add</Button>
            </div>
            {invited.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {invited.map((em, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground">{em}<span className="text-xs text-muted-foreground">Invite pending</span></div>
                ))}
              </div>
            )}
            <button type="button" onClick={next} className="mt-4 text-xs text-muted-foreground hover:text-foreground">Skip — I'll invite people later</button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">You're all set</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {workspaceName} is live{invited.length > 0 ? \`, \${invited.length} teammate\${invited.length === 1 ? '' : 's'} invited\` : ''} — your dashboard is ready with sample ${featureLabel} so you can see how everything fits together.
            </p>
          </div>
        )}

        <Button onClick={next} className="mt-8 w-full">{step === STEPS.length - 1 ? 'Go to dashboard' : 'Continue'}</Button>
      </div>
    </div>
  )
}
`
}

export function dashboardFile(config) {
  const kpiCards = config.kpis.map((k) => `
        <div className="rounded-2xl border border-border bg-card p-5">
          <StatBlock value={${typeof k.value === 'number' ? k.value : `'${k.value}'`}} label="${k.label}"${k.suffix ? ` suffix="${k.suffix}"` : ''}${typeof k.delta === 'number' ? ` delta={${k.delta}}` : ''} />
          <ResponsiveContainer width="100%" height={44}>
            <AreaChart data={${JSON.stringify(k.spark.map((v) => ({ v })))}}>
              <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>`).join('\n')

  const activityItems = config.activity.map((a) => `
          <StaggerItem className="flex items-start gap-3 py-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">${a.label}</p>
              <p className="text-xs text-muted-foreground">${a.time}</p>
            </div>
          </StaggerItem>`).join('\n')

  const isHighlights = config.dashboardVariant === 'highlights'
  const highlightCards = isHighlights
    ? (config.highlights || []).map((h) => `
          <BentoCard title="${h.title}" description="${h.description}" />`).join('\n')
    : ''

  const secondaryPanel = isHighlights
    ? `<Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Highlights</h3>
          <BentoGrid className="!grid-cols-1 !auto-rows-min gap-3">${highlightCards}
          </BentoGrid>
        </Card>`
    : `<Card>
          <h3 className="mb-1 text-sm font-semibold text-foreground">Recent activity</h3>
          <Stagger className="mt-3 divide-y divide-border">${activityItems}
          </Stagger>
        </Card>`

  return `import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { StatBlock, Card, Stagger, StaggerItem, Badge${isHighlights ? ', BentoGrid, BentoCard' : ''} } from '../wyber-ui'
import { useAuth } from '../contexts/AuthContext'

const WEEKLY = ${JSON.stringify(config.weeklyBars)}

export default function Dashboard() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{greeting}, {(user?.name || '${esc(config.greetingName)}').split(' ')[0]}.</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">${config.greetingInsight}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">${kpiCards}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">${config.primaryFeatureLabel} — last 8 weeks</h3>
            <Badge variant="outline">Weekly</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY}>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        ${secondaryPanel}
      </div>
    </div>
  )
}
`
}

export function analyticsFile(config) {
  const kpiCards = config.analyticsKpis.map((k) => `
        <StatBlock value={${typeof k.value === 'number' ? k.value : `'${k.value}'`}} label="${k.label}"${k.suffix ? ` suffix="${k.suffix}"` : ''}${typeof k.delta === 'number' ? ` delta={${k.delta}}` : ''} />`).join('\n')

  const rankedRows = config.rankedTable.rows.map((r, i) => `
              <div key={${i}} className="flex items-center gap-3 py-2">
                <span className="w-5 font-mono text-xs text-muted-foreground">${'{'}${i + 1}${'}'}</span>
                <span className="flex-1 text-sm text-foreground">${r.name}</span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: '${Math.round((r.value / Math.max(...config.rankedTable.rows.map((x) => x.value))) * 100)}%' }} />
                </div>
                <span className="w-14 text-right font-mono text-xs tabular-nums text-muted-foreground">${r.value}</span>
              </div>`).join('')

  return `import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { StatBlock, Card, Tabs } from '../wyber-ui'

const TREND = ${JSON.stringify(config.trend)}
const SOURCES = ${JSON.stringify(config.sources)}
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent-foreground))', 'hsl(var(--muted-foreground))', 'hsl(var(--secondary-foreground))']

export default function Analytics() {
  const [range, setRange] = useState('30d')

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <Tabs tabs={[{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }, { id: '1y', label: '1Y' }]} active={range} onChange={setRange} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">${kpiCards}
      </div>

      <Card className="mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={TREND}>
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">By source</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SOURCES}>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SOURCES} dataKey="value" nameKey="label" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {SOURCES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">${config.rankedTable.label}</h3>
          <div className="divide-y divide-border">${rankedRows}
          </div>
        </Card>
      </div>
    </div>
  )
}
`
}

export function notificationsFile(config) {
  const items = config.notifications.map((n) => `
          <div className="flex items-start gap-3 border-b border-border px-5 py-4 last:border-0">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" style={{ opacity: ${n.unread ? 1 : 0} }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">${n.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">${n.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">${n.time}</p>
            </div>
            <Badge variant="${n.tone}">${n.unread ? 'New' : 'Read'}</Badge>
          </div>`).join('')

  return `import { useState } from 'react'
import { Tabs, Badge, Button, Card } from '../wyber-ui'

export default function Notifications() {
  const [tab, setTab] = useState('all')

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Notifications</h2>
        <Button variant="ghost" size="sm">Mark all as read</Button>
      </div>
      <Tabs tabs={[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }]} active={tab} onChange={setTab} className="mb-4" />
      <Card className="p-0">${items}
      </Card>
    </div>
  )
}
`
}

// Real audit event sentences derived from the app's own recent-activity
// content — specific, not "Item updated" — per the AUDIT LOG spec.
function auditEvents(config) {
  const actors = (config.team || [{ name: config.greetingName }]).map((m) => m.name)
  const base = (config.activity || []).map((a, i) => ({
    actor: actors[i % actors.length],
    action: a.label,
    time: a.time,
  }))
  while (base.length < 12) {
    const a = actors[base.length % actors.length]
    base.push({ actor: a, action: `updated a ${config.primaryFeatureSingular || 'record'}`, time: `${base.length + 1} days ago` })
  }
  return base
}

export function settingsFile(config) {
  const auditJson = JSON.stringify(auditEvents(config))
  // Web App is single-tenant per buildSystemPrompt — "no org hierarchy, no
  // billing within the app" — so Billing/Team/Activity(-audit-log) don't
  // apply; Integrations stays (a personal task tool still connects to
  // Slack/Zapier/etc). SaaS keeps the full multi-tenant set.
  const isWebApp = config.archetype === 'webapp'
  const tabsList = isWebApp
    ? `[
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]`
    : `[
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'team', label: 'Team', icon: UsersIcon },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
]`
  return `import { useState } from 'react'
import { User, Shield, Bell, CreditCard, Users as UsersIcon, Key, Plug, Activity as ActivityIcon, Copy, Eye, EyeOff } from 'lucide-react'
import { Card, Input, Button, Switch, PricingCard, Badge } from '../../wyber-ui'

const TABS = ${tabsList}

const AUDIT_EVENTS = ${auditJson}
const INTEGRATIONS = [
  { name: 'Slack', description: 'Get alerts in a channel when something needs attention.', connected: true },
  { name: 'Google Calendar', description: 'Sync deadlines and meetings automatically.', connected: false },
  { name: 'Zapier', description: 'Connect ${esc(config.appName)} to 5,000+ other apps.', connected: false },
  { name: 'Webhooks', description: 'Send real-time event data to your own endpoint.', connected: true },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')
  const [notif, setNotif] = useState({ email: true, inapp: true, digest: false })
  const [keys, setKeys] = useState([{ id: '1', name: 'Production', prefix: 'wyb_live_', revealed: false }])
  const [newKeyName, setNewKeyName] = useState('')

  const createKey = () => {
    if (!newKeyName.trim()) return
    setKeys(k => [...k, { id: String(Date.now()), name: newKeyName.trim(), prefix: 'wyb_live_', revealed: true }])
    setNewKeyName('')
  }
  const revokeKey = (id) => setKeys(k => k.filter(x => x.id !== id))
  const toggleReveal = (id) => setKeys(k => k.map(x => x.id === id ? { ...x, revealed: !x.revealed } : x))

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      <div className="w-48 shrink-0">
        <div className="flex flex-col gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ' + (tab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1">
        {tab === 'profile' && (
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-foreground">Profile</h3>
            <div className="flex flex-col gap-4">
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</label><Input defaultValue="${config.greetingName}" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label><Input type="email" defaultValue="${config.greetingName.toLowerCase().replace(/\s+/g, '.')}@${config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Timezone</label><Input defaultValue="America/New_York" /></div>
              <Button className="mt-2 w-fit">Save changes</Button>
            </div>
          </Card>
        )}

        {tab === 'security' && (
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-foreground">Security</h3>
            <div className="flex flex-col gap-5">
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">New password</label><Input type="password" placeholder="••••••••" /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">Require a code from your authenticator app when signing in.</p>
                </div>
                <Switch checked={false} onChange={() => {}} />
              </div>
            </div>
          </Card>
        )}

        {tab === 'notifications' && (
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-foreground">Notifications</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div><p className="text-sm font-medium text-foreground">Email alerts</p><p className="text-xs text-muted-foreground">Get emailed the moment something needs your attention.</p></div>
                <Switch checked={notif.email} onChange={v => setNotif(n => ({ ...n, email: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div><p className="text-sm font-medium text-foreground">In-app notifications</p><p className="text-xs text-muted-foreground">Show a badge on the bell icon for new activity.</p></div>
                <Switch checked={notif.inapp} onChange={v => setNotif(n => ({ ...n, inapp: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div><p className="text-sm font-medium text-foreground">Daily digest</p><p className="text-xs text-muted-foreground">Receive a daily summary of new activity at 9 AM.</p></div>
                <Switch checked={notif.digest} onChange={v => setNotif(n => ({ ...n, digest: v }))} />
              </div>
            </div>
          </Card>
        )}

        {tab === 'billing' && (
          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Growth plan</p>
                  <p className="text-xs text-muted-foreground">$149/month — up to 10 team seats, unlimited ${config.primaryFeatureLabel.toLowerCase()}</p>
                </div>
                <Button variant="outline" size="sm">Change plan</Button>
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Team seats</span><span>6 of 10 used</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[60%] rounded-full bg-primary" /></div>
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PricingCard name="Solo" price="$49" features={['1 seat', 'Core features', 'Email support']} cta="Downgrade" />
              <PricingCard name="Growth" price="$149" features={['10 seats', 'All features', 'Priority support']} featured cta="Current plan" />
              <PricingCard name="Scale" price="$399" features={['Unlimited seats', 'SSO', 'Dedicated support']} cta="Upgrade" />
            </div>
          </div>
        )}

        {tab === 'team' && (
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Team members</h3>
              <Button size="sm">Invite member</Button>
            </div>
            <div className="divide-y divide-border">
              {${JSON.stringify(config.team)}.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{m.name.split(' ').map(w => w[0]).join('')}</div>
                    <div><p className="text-sm text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                  </div>
                  <select defaultValue={m.role} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <option>Owner</option><option>Admin</option><option>Member</option><option>Viewer</option>
                  </select>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'apikeys' && (
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
            </div>
            <div className="mb-5 flex gap-2">
              <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name, e.g. Production" />
              <Button onClick={createKey}>Generate</Button>
            </div>
            <div className="divide-y divide-border">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{k.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{k.revealed ? k.prefix + Math.random().toString(36).slice(2, 18) : k.prefix + '••••••••••••••'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleReveal(k.id)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      {k.revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Copy size={14} /></button>
                    <Button variant="ghost" size="sm" onClick={() => revokeKey(k.id)}>Revoke</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'integrations' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INTEGRATIONS.map(i => (
              <Card key={i.name} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{i.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{i.description}</p>
                </div>
                <Button variant={i.connected ? 'outline' : 'primary'} size="sm">{i.connected ? 'Connected' : 'Connect'}</Button>
              </Card>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <Card className="p-0">
            <div className="divide-y divide-border">
              {AUDIT_EVENTS.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {ev.actor.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground"><span className="font-medium">{ev.actor}</span> <span className="text-muted-foreground">{ev.action}</span></p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
`
}
