// The screens every generated SaaS has: sign-up and sign-in, team and roles, billing, setup, settings, admin overview, legal pages, first-run checklist.
// Same rules as runtime-core.ts: String.raw templates, NO backticks, NO ${ sequences. Every state says what is real and what is demo.

export const PARTS_TSX = String.raw`import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Badge, Button, Card } from '../wyber-ui'
import { isConnected, sendMail, type Mail as MailT, type StatusResult } from '../lib/saas'

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
      {intro ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{intro}</p> : null}
    </header>
  )
}

/** An email shown on screen. It is only ever a preview until the email service is connected; it never claims to have been sent. */
export function EmailPreview({ mail, kind, workspace, workspaceName, link, status }: {
  mail: MailT; kind: 'welcome' | 'invite' | 'receipt'; workspace: string; workspaceName: string; link: string; status: StatusResult | null
}) {
  const [result, setResult] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const live = isConnected(status, 'email')
  const send = async () => {
    setBusy(true)
    const r = await sendMail(kind, mail, workspace, workspaceName, link)
    setResult(r.sent ? 'Sent to ' + mail.to + '.' : r.error || 'The email was not sent.')
    setBusy(false)
  }
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground"><Mail size={16} aria-hidden="true" />Email preview</p>
        <Badge variant="outline">{live ? 'Ready to send' : 'Demo: not sent'}</Badge>
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted-foreground">To</dt><dd className="break-all text-foreground">{mail.to}</dd></div>
        <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted-foreground">Subject</dt><dd className="text-foreground">{mail.subject}</dd></div>
      </dl>
      <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 font-sans text-sm text-foreground">{mail.text}</pre>
      {live ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={send} disabled={busy}>Send this email</Button>
          {result ? <p role="status" className="text-sm text-muted-foreground">{result}</p> : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing was sent. Connect email in Setup and this becomes a real send.</p>
      )}
    </Card>
  )
}
`

export const AUTH_TSX = String.raw`import { useState } from 'react'
import { Button, Card, Input, Tabs } from '../wyber-ui'
import { APP } from '../schema'
import { hashPassword, passwordHints, productName, validEmail, composeMail, type SaasState } from '../lib/saas'
import { EmailPreview } from './parts'

export default function AuthPage({ state, onState }: { state: SaasState; onState: (s: SaasState, welcome?: boolean) => void }) {
  const [mode, setMode] = useState<string>(state.account ? 'in' : 'up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(state.account ? state.account.email : '')
  const [pw, setPw] = useState('')
  const [ws, setWs] = useState('')
  const [consent, setConsent] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }))
  const hints = touched.pw ? passwordHints(pw) : []
  const emailBad = touched.email && email.trim() !== '' && !validEmail(email)

  const submitUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, pw: true, ws: true })
    setError('')
    if (!name.trim() || !validEmail(email) || passwordHints(pw).length > 0 || !ws.trim()) { setError('Fill in every field to continue. The hints under the fields say what is missing.'); return }
    if (!consent) { setError('Agree to the Terms and the Privacy policy to create an account.'); return }
    const hash = await hashPassword(email, pw)
    const id = 'ws-' + Math.random().toString(36).slice(2, 12)
    const now = new Date().toISOString()
    onState({
      ...state,
      account: { name: name.trim(), email: email.trim(), hash, at: now }, signedIn: true, consentAt: now,
      workspace: { id, name: ws.trim() }, role: 'owner',
      members: [{ id: 'me', email: email.trim(), role: 'owner', status: 'active', at: now }], checklistDismissed: false,
    }, true)
  }
  const submitIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!state.account) { setError('There is no account in this browser yet. Create one first.'); return }
    const hash = await hashPassword(email, pw)
    if (state.account.email.toLowerCase() !== email.trim().toLowerCase() || state.account.hash !== hash) { setError('That email and password do not match the account in this browser.'); return }
    onState({ ...state, signedIn: true })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <a href="#/" className="mb-3 inline-flex min-h-10 items-center self-start text-sm text-muted-foreground underline underline-offset-4">Back to {productName()}</a>
      <h1 className="font-display text-3xl font-semibold text-foreground">{mode === 'up' ? 'Create your workspace' : 'Sign in'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">This is a demo account kept in this browser only. Nothing is sent to a server, and email verification needs the email service, which is not connected here.</p>
      <div className="mt-6"><Tabs tabs={[{ id: 'up', label: 'Create account' }, { id: 'in', label: 'Sign in' }]} active={mode} onChange={m => { setMode(m); setError(''); setForgot(false) }} /></div>
      <Card className="mt-4 p-5">
        {mode === 'up' ? (
          <form onSubmit={submitUp} className="space-y-4" noValidate>
            <div>
              <label htmlFor="su-name" className="mb-1.5 block text-sm font-medium text-foreground">Your name</label>
              <Input id="su-name" value={name} onChange={e => setName(e.target.value)} onBlur={() => touch('name')} autoComplete="name" />
              {touched.name && !name.trim() ? <p className="mt-1 text-xs text-destructive">Enter your name.</p> : null}
            </div>
            <div>
              <label htmlFor="su-email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input id="su-email" type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch('email')} autoComplete="email" />
              {emailBad ? <p className="mt-1 text-xs text-destructive">That does not look like an email address yet.</p> : null}
            </div>
            <div>
              <label htmlFor="su-pw" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <Input id="su-pw" type="password" value={pw} onChange={e => { setPw(e.target.value); touch('pw') }} autoComplete="new-password" />
              {hints.length ? <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">{hints.map(h => <li key={h}>{h}</li>)}</ul> : null}
            </div>
            <div>
              <label htmlFor="su-ws" className="mb-1.5 block text-sm font-medium text-foreground">Workspace name</label>
              <Input id="su-ws" value={ws} onChange={e => setWs(e.target.value)} onBlur={() => touch('ws')} autoComplete="organization" />
              {touched.ws && !ws.trim() ? <p className="mt-1 text-xs text-destructive">Name the workspace, for example your business name.</p> : null}
            </div>
            <label className="flex min-h-10 items-start gap-3 py-2 text-sm text-foreground" htmlFor="su-consent">
              <input id="su-consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
              <span>I agree to the <a className="underline underline-offset-4" href="#/terms">Terms</a> and the <a className="underline underline-offset-4" href="#/privacy">Privacy policy</a>.</span>
            </label>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full">Create account</Button>
          </form>
        ) : forgot ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Reset links need the email service and real sign-in, and this demo account lives only in this browser. Here is the email a reset would send:</p>
            <EmailPreview mail={composeMail('reset', email || 'you@example.com', state.workspace ? state.workspace.name : APP.name, window.location.origin + '/#/app')} kind="welcome" workspace={state.workspace ? state.workspace.id : 'ws-demo0000'} workspaceName={APP.name} link={window.location.origin + '/#/app'} status={null} />
            <Button variant="outline" onClick={() => setForgot(false)}>Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submitIn} className="space-y-4" noValidate>
            <div>
              <label htmlFor="si-email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input id="si-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="si-pw" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <Input id="si-pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full">Sign in</Button>
            <button type="button" className="min-h-10 text-sm text-muted-foreground underline underline-offset-4 md:min-h-0" onClick={() => setForgot(true)}>Forgot your password?</button>
          </form>
        )}
      </Card>
    </div>
  )
}
`

export const TEAM_TSX = String.raw`import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { Badge, Button, Card, Input } from '../wyber-ui'
import { ROLES, can, composeMail, inviteLimit, inviteLink, roleNote, validEmail, type Member, type Role, type SaasState, type StatusResult } from '../lib/saas'
import { EmailPreview, PageHeader } from './parts'

export default function TeamPage({ state, onState, planId, status, onLimit }: {
  state: SaasState; onState: (s: SaasState) => void; planId: string; status: StatusResult | null; onLimit: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [touched, setTouched] = useState(false)
  const [last, setLast] = useState<{ member: Member; link: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const ws = state.workspace
  const manage = can(state.role, 'manage')
  const bad = touched && email.trim() !== '' && !validEmail(email)

  const invite = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!validEmail(email)) return
    const limit = inviteLimit(planId, state.members.length)
    if (!limit.ok) { onLimit(limit.message); return }
    if (state.members.some(m => m.email.toLowerCase() === email.trim().toLowerCase())) return
    const code = Math.random().toString(36).slice(2, 10)
    const member: Member = { id: code, email: email.trim(), role, status: 'invited', at: new Date().toISOString() }
    onState({ ...state, members: [...state.members, member] })
    setLast({ member, link: inviteLink(ws ? ws.id : '', code) })
    setEmail(''); setTouched(false); setCopied(false)
  }
  const setRoleOf = (id: string, r: Role) => onState({ ...state, members: state.members.map(m => (m.id === id ? { ...m, role: r } : m)) })
  const removeMember = (id: string) => onState({ ...state, members: state.members.filter(m => m.id !== id) })
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) } }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Team" intro={ws ? 'People in the workspace ' + ws.name + ' and what each may do.' : 'Your workspace.'} />
      {roleNote(state.role) ? <Card className="p-4"><p role="status" className="text-sm text-muted-foreground">{roleNote(state.role)}</p></Card> : null}
      <Card className="divide-y divide-border p-0">
        {state.members.map(m => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{m.email}</p>
              <p className="text-xs text-muted-foreground">{m.status === 'invited' ? 'Invited, has not joined' : 'Active'}</p>
            </div>
            <div className="flex items-center gap-2">
              {manage && m.role !== 'owner' ? (
                <>
                  <label className="sr-only" htmlFor={'role-' + m.id}>Role of {m.email}</label>
                  <select id={'role-' + m.id} value={m.role} onChange={e => setRoleOf(m.id, e.target.value as Role)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground">
                    {ROLES.filter(r => r !== 'owner').map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => removeMember(m.id)} aria-label={'Remove ' + m.email}><Trash2 size={16} aria-hidden="true" /></Button>
                </>
              ) : <Badge variant="outline">{m.role}</Badge>}
            </div>
          </div>
        ))}
      </Card>

      {manage ? (
        <Card className="space-y-4 p-5">
          <h2 className="font-medium text-foreground">Invite someone</h2>
          <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-start" noValidate>
            <div>
              <label htmlFor="inv-email" className="sr-only">Email to invite</label>
              <Input id="inv-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setTouched(true)} />
              {bad ? <p className="mt-1 text-xs text-destructive">That does not look like an email address yet.</p> : null}
            </div>
            <div>
              <label htmlFor="inv-role" className="sr-only">Role</label>
              <select id="inv-role" value={role} onChange={e => setRole(e.target.value as Role)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                {ROLES.filter(r => r !== 'owner').map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button type="submit">Create invite</Button>
          </form>
          <p className="text-xs text-muted-foreground">An invite is a link you copy and send yourself. When email is connected in Setup, the link can also go by email.</p>
        </Card>
      ) : null}

      {last && ws ? (
        <div className="space-y-3">
          <Card className="space-y-2 p-4">
            <p className="text-sm font-medium text-foreground">Invite link for {last.member.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">{last.link}</code>
              <Button variant="outline" size="sm" onClick={() => copy(last.link)}><Copy size={16} aria-hidden="true" />{copied ? 'Copied' : 'Copy link'}</Button>
            </div>
            <p className="text-xs text-muted-foreground">In this demo the link opens the same browser's workspace. Real shared workspaces need real sign-in.</p>
          </Card>
          <EmailPreview mail={composeMail('invite', last.member.email, ws.name, last.link)} kind="invite" workspace={ws.id} workspaceName={ws.name} link={last.link} status={status} />
        </div>
      ) : null}

      {state.account && state.account.email ? (
        <Card className="space-y-2 p-5">
          <h2 className="font-medium text-foreground">View as another role (demo)</h2>
          <p className="text-sm text-muted-foreground">Real roles need real sign-in. Until then you can look at the product the way each role would see it, to check the limits.</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => <Button key={r} size="sm" variant={state.role === r ? 'primary' : 'outline'} onClick={() => onState({ ...state, role: r })}>{r}</Button>)}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
`

export const BILLING_TSX = String.raw`import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Badge, Button, Card, ProgressBar } from '../wyber-ui'
import { APP } from '../schema'
import { PLANS, RECORD_NOUN, planById, priceLabel, type Plan } from '../plans'
import { can, isConnected, openPortal, startCheckout, type SaasState, type StatusResult, type SubscriptionResult, type Usage } from '../lib/saas'
import { PageHeader } from './parts'

const STATUS_TEXT: Record<string, string> = { active: 'Active', trialing: 'Trial', past_due: 'Payment overdue', canceled: 'Cancelled' }
const limitText = (n: number | null, noun: string) => (n === null ? 'Unlimited ' + noun : 'Up to ' + n + ' ' + noun)

export default function BillingPage({ state, planId, sub, onRefresh, status, usage }: {
  state: SaasState; planId: string; sub: SubscriptionResult | null; onRefresh: () => void; status: StatusResult | null; usage: Usage
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const payments = isConnected(status, 'payments')
  const stored = sub && sub.state === 'ok' ? sub.subscription : null
  const current = planById(planId)
  const manage = can(state.role, 'manage')
  const ws = state.workspace ? state.workspace.id : ''

  useEffect(() => {
    if (/checkout=done/.test(window.location.hash)) setNote('Thank you. Your plan appears here once the payment service confirms it with a verified message. Check again in a moment.')
    else if (/checkout=cancelled/.test(window.location.hash)) setNote('Checkout was cancelled. Nothing was charged.')
  }, [])

  const upgrade = async (p: Plan) => {
    setBusy(p.id); setNote('')
    const r = await startCheckout(ws, p.id)
    if (r.url) { window.location.href = r.url; return }
    setNote(r.error || 'Checkout did not start.')
    setBusy('')
  }
  const portal = async () => {
    setBusy('portal'); setNote('')
    const r = await openPortal(ws)
    if (r.url) { window.location.href = r.url; return }
    setNote(r.error || 'The billing portal did not open.')
    setBusy('')
  }
  const buttonFor = (p: Plan) => {
    if (p.id === current.id) return <Button variant="outline" disabled className="w-full">Current plan</Button>
    if (!manage) return <Button variant="outline" disabled className="w-full">Ask an admin to upgrade</Button>
    if (!payments) return <Button variant="outline" disabled className="w-full">Connect payments to enable</Button>
    if (p.price === null) return <Button variant="outline" disabled className="w-full">Price not set yet</Button>
    if (p.price === 0) return <Button variant="outline" disabled className="w-full">Free plan</Button>
    return <Button className="w-full" disabled={busy === p.id} onClick={() => upgrade(p)}>{'Upgrade to ' + p.name}</Button>
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader title="Billing and plans" intro="Your plan, what it allows and what it costs. The plan shown is the one stored on the server after a verified payment, never a guess." />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Subscription</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">{current.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stored
                ? (STATUS_TEXT[stored.status] || stored.status) + (stored.renewsOn ? ', renews on ' + stored.renewsOn : stored.endsOn ? ', ends on ' + stored.endsOn : '')
                : !sub ? 'Checking the stored subscription.'
                : sub.state === 'not-configured' ? 'Subscription storage is not connected, so a paid state cannot be shown. Connect it in Setup.'
                : sub.state === 'unreachable' ? 'The server could not be reached. Server features run once the app is deployed. Showing the first plan.'
                : 'No subscription stored for this workspace. You are on the first plan.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stored ? <Badge variant={stored.status === 'past_due' ? 'destructive' : 'outline'}>{STATUS_TEXT[stored.status] || stored.status}</Badge> : <Badge variant="outline">Demo</Badge>}
            <Button variant="outline" size="sm" onClick={onRefresh}>Check again</Button>
            {stored && stored.customer && manage ? <Button size="sm" onClick={portal} disabled={busy === 'portal'}>Manage billing</Button> : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-foreground">{RECORD_NOUN.many.charAt(0).toUpperCase() + RECORD_NOUN.many.slice(1)}</span><span className="text-muted-foreground">{usage.records + (current.limits.records === null ? ' (no limit)' : ' of ' + current.limits.records)}</span></div>
            <ProgressBar value={usage.records} max={current.limits.records === null ? Math.max(usage.records, 1) * 4 : current.limits.records} />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-foreground">Team members</span><span className="text-muted-foreground">{usage.seats + (current.limits.seats === null ? ' (no limit)' : ' of ' + current.limits.seats)}</span></div>
            <ProgressBar value={usage.seats} max={current.limits.seats === null ? Math.max(usage.seats, 1) * 4 : current.limits.seats} />
          </div>
        </div>
        {note ? <p role="status" className="text-sm text-foreground">{note}</p> : null}
      </Card>

      <section aria-label="Plans" className={'grid gap-4 ' + (PLANS.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
        {PLANS.map(p => (
          <Card key={p.id} className={'flex flex-col gap-4 p-5 ' + (p.id === current.id ? 'border-primary' : '')}>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">{priceLabel(p)}</p>
            <ul className="flex-1 space-y-2 text-sm text-foreground">
              <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{limitText(p.limits.records, RECORD_NOUN.many)}</li>
              <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{limitText(p.limits.seats, 'team members')}</li>
              {p.features.map(f => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{f}</li>)}
            </ul>
            {buttonFor(p)}
          </Card>
        ))}
      </section>
      <p className="text-xs text-muted-foreground">Plan names and limits are starting values written for {APP.name}. A price is shown only where the owner gave one. Everything here is read from src/plans.ts.</p>
    </div>
  )
}
`

export const SETUP_TSX = String.raw`import { useEffect, useState } from 'react'
import { Badge, Button, Card } from '../wyber-ui'
import { fetchStatus, type StatusResult } from '../lib/saas'
import { PageHeader } from './parts'

export default function SetupPage({ status, onStatus }: { status: StatusResult | null; onStatus: (s: StatusResult) => void }) {
  const [busy, setBusy] = useState(false)
  const check = async () => { setBusy(true); onStatus(await fetchStatus()); setBusy(false) }
  useEffect(() => { if (!status) void check() }, [])
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Setup" intro="What is connected and what is not. Each service stays off until you set its values in your hosting settings." />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={check} disabled={busy}>{busy ? 'Checking' : 'Check again'}</Button>
      </div>
      {!status ? <Card className="p-5"><p role="status" className="text-sm text-muted-foreground">Checking the services.</p></Card> : null}
      {status && status.state === 'unreachable' ? (
        <Card className="space-y-2 p-5">
          <h2 className="font-medium text-foreground">The status check could not be reached</h2>
          <p className="text-sm text-muted-foreground">Server features run once the app is deployed. Until then every service below counts as Not connected, and the product runs in demo mode.</p>
        </Card>
      ) : null}
      {(status && status.state === 'ok' ? status.services : []).map(s => (
        <Card key={s.id} className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-foreground">{s.label}</h2>
            <Badge variant={s.connected ? 'solid' : 'outline'}>{s.connected ? 'Connected' : 'Not connected'}</Badge>
          </div>
          {s.vars.length ? (
            <ul className="space-y-1 text-sm">
              {s.vars.map(v => <li key={v.name} className="flex items-center justify-between gap-3"><code className="text-foreground">{v.name}</code><span className="text-muted-foreground">{v.set ? 'set' : 'not set'}</span></li>)}
            </ul>
          ) : null}
          <p className="text-sm text-muted-foreground">{s.where}</p>
        </Card>
      ))}
    </div>
  )
}
`

export const SETTINGS_TSX = String.raw`import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { Badge, Button, Card, Input } from '../wyber-ui'
import { APP } from '../schema'
import { PLANS, priceLabel } from '../plans'
import { exportAll, type Store } from '../lib/db'
import { downloadText } from '../lib/csv'
import { can, exportEverything, type SaasState } from '../lib/saas'
import { PageHeader } from './parts'

export default function SettingsPage({ state, store, onDelete, go }: { state: SaasState; store: Store; onDelete: () => void; go: (v: string) => void }) {
  const [typed, setTyped] = useState('')
  const ok = typed.trim().toUpperCase() === 'DELETE'
  const owner = can(state.role, 'manage') && state.role === 'owner'
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" intro="Your account, your plan and your data." />
      <Card className="space-y-3 p-5">
        <h2 className="font-medium text-foreground">Account</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Name</dt><dd className="text-foreground">{state.account ? state.account.name : ''}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="break-all text-foreground">{state.account ? state.account.email : ''}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Workspace</dt><dd className="text-foreground">{state.workspace ? state.workspace.name : ''}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Agreed to terms</dt><dd className="text-foreground">{state.consentAt ? state.consentAt.slice(0, 10) : 'Not recorded'}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">This is a demo account kept in this browser only.</p>
      </Card>
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-medium text-foreground">Plans</h2><Button variant="outline" size="sm" onClick={() => go('billing')}>Open billing</Button></div>
        <ul className="divide-y divide-border text-sm">
          {PLANS.map(p => <li key={p.id} className="flex items-center justify-between gap-3 py-2"><span className="text-foreground">{p.name}</span><span className="text-muted-foreground">{priceLabel(p)}</span></li>)}
        </ul>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-medium text-foreground">Export my data</h2>
        <p className="text-sm text-muted-foreground">Downloads one file with your account details, the team, every list and the change history.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => downloadText(APP.id + '-my-data.json', exportEverything(store, state), 'application/json')}><Download size={16} aria-hidden="true" />Export my data</Button>
          <Button variant="outline" onClick={() => downloadText(APP.id + '-backup.json', exportAll(store), 'application/json')}>Records only</Button>
        </div>
      </Card>
      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2"><h2 className="font-medium text-foreground">Delete my account</h2><Badge variant="outline">Cannot be undone</Badge></div>
        <p className="text-sm text-muted-foreground">Removes the account, the workspace, every record and the history from this browser. If payments are connected, billing records stay with the payment service and the subscription storage until you delete them there.</p>
        {owner ? (
          <>
            <div>
              <label htmlFor="confirm-delete" className="mb-1.5 block text-sm font-medium text-foreground">Type DELETE to confirm</label>
              <Input id="confirm-delete" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" />
            </div>
            <Button variant="destructive" disabled={!ok} onClick={() => { onDelete(); setTyped('') }}><Trash2 size={16} aria-hidden="true" />Delete my account</Button>
          </>
        ) : <p className="text-sm text-muted-foreground">Only the owner can delete the account.</p>}
      </Card>
      <p className="text-xs text-muted-foreground"><a className="underline underline-offset-4" href="#/terms">Terms</a> and <a className="underline underline-offset-4" href="#/privacy">Privacy policy</a></p>
    </div>
  )
}
`

export const ADMIN_TSX = String.raw`import { useState } from 'react'
import { Badge, Button, Card, StatBlock } from '../wyber-ui'
import { CURRENCY, PLANS, planById, priceLabel } from '../plans'
import type { SaasState, SubscriptionResult } from '../lib/saas'
import { PageHeader } from './parts'

// Demo customers are worked out from the plans, labelled Demo everywhere and never mixed with the stored subscription.
const DEMO_NAMES = ['Demo customer A', 'Demo customer B', 'Demo customer C', 'Demo customer D', 'Demo customer E']
const demoCustomers = () => DEMO_NAMES.map((n, i) => ({ name: n, plan: PLANS[i % PLANS.length].id, status: i === 4 ? 'past_due' : 'active' }))

export default function AdminPage({ state, sub, planId }: { state: SaasState; sub: SubscriptionResult | null; planId: string }) {
  const [demo, setDemo] = useState(false)
  const stored = sub && sub.state === 'ok' ? sub.subscription : null
  const rows = demo ? demoCustomers() : stored ? [{ name: state.workspace ? state.workspace.name : 'This workspace', plan: stored.plan, status: stored.status }] : []
  const paying = rows.filter(r => r.status === 'active' || r.status === 'trialing')
  const priced = paying.every(r => planById(r.plan).price !== null)
  const mrr = paying.reduce((n, r) => { const p = planById(r.plan); return n + (p.price === null ? 0 : p.period === 'year' ? p.price / 12 : p.price) }, 0)
  const label = demo ? 'Demo' : 'Stored'
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Owner overview" intro="Users, plans and monthly recurring revenue, worked out from stored subscriptions. Figures marked Demo are examples, not real customers." />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant={demo ? 'primary' : 'outline'} size="sm" onClick={() => setDemo(d => !d)}>{demo ? 'Hide demo figures' : 'Show demo figures'}</Button>
        <Badge variant="outline">{label}</Badge>
      </div>
      <section aria-label="Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5"><StatBlock value={demo ? rows.length : state.members.length} label={demo ? 'Customers (demo)' : 'Users in this workspace'} /></Card>
        <Card className="p-5"><StatBlock value={paying.length} label={demo ? 'Paying (demo)' : 'Paying workspaces'} /></Card>
        <Card className="p-5"><StatBlock value={priced ? CURRENCY + Math.round(mrr).toLocaleString('en-IN') : 'Not set'} label={demo ? 'Monthly revenue (demo)' : 'Monthly revenue'} /></Card>
        <Card className="p-5"><StatBlock value={planById(planId).name} label="This workspace plan" /></Card>
      </section>
      {!priced ? <p className="text-sm text-muted-foreground" role="status">Revenue shows once every paying plan has a price in src/plans.ts. Prices are never guessed.</p> : null}
      <Card className="divide-y divide-border p-0">
        {rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No stored subscriptions yet. They appear here after a verified payment. Use Show demo figures to see how this page looks with customers.</p> : null}
        {rows.map(r => (
          <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-foreground">{r.name}</span>
            <span className="text-muted-foreground">{planById(r.plan).name + ', ' + priceLabel(planById(r.plan))}</span>
            <Badge variant={r.status === 'past_due' ? 'destructive' : 'outline'}>{(demo ? 'Demo, ' : '') + r.status.replace('_', ' ')}</Badge>
          </div>
        ))}
      </Card>
    </div>
  )
}
`

export const LEGAL_TSX = String.raw`import { OWNER } from '../owner-details'
import { APP } from '../schema'

const who = () => OWNER.name || 'the owner of ' + (OWNER.productName || APP.name)

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <a href="#/" className="inline-flex min-h-10 items-center text-sm text-muted-foreground underline underline-offset-4">Back to {OWNER.productName || APP.name}</a>
        <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">These pages are a starting point written from what the owner told us. They are not legal advice. Have them reviewed before you take payments or store other people's data.</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>
        <p className="mt-10 text-sm text-muted-foreground"><a className="inline-block min-w-10 py-3 underline underline-offset-4" href="#/terms">Terms</a> · <a className="inline-block py-3 underline underline-offset-4" href="#/privacy">Privacy policy</a></p>
      </main>
    </div>
  )
}
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-1 text-base font-medium text-foreground">{children}</h2>

export function Terms() {
  return (
    <Page title="Terms of use">
      <section><H>Who we are</H><p>{OWNER.productName || APP.name} is provided by {who()}{OWNER.country ? ', ' + OWNER.country : ''}.{OWNER.email ? ' Contact: ' + OWNER.email + '.' : ''}</p></section>
      <section><H>Using the product</H><p>You may use the product for your own business. You are responsible for what you enter and for keeping your sign-in details private. Do not use it to break the law or to harm other people.</p></section>
      <section><H>Plans and payment</H><p>Plans, limits and prices are shown in the product. A price applies only where one is shown. Payments are handled by the payment service the owner connects; a plan changes only after the payment service confirms the payment.</p></section>
      <section><H>Your data</H><p>You own what you enter. You can export it or delete your account at any time in Settings.</p></section>
      <section><H>Changes and contact</H><p>These terms may change; the date of the change is shown here when it does.{OWNER.email ? ' Write to ' + OWNER.email + ' with questions.' : ''}</p></section>
    </Page>
  )
}
export function Privacy() {
  return (
    <Page title="Privacy policy">
      <section><H>What is stored</H><p>The account details you enter, your workspace, team list and records are saved in your browser on this device. In the demo they are not sent to a server.</p></section>
      <section><H>What leaves your browser</H><p>When the owner has connected services, three things can leave: a payment is handled by the payment service; a subscription state is kept on the owner's subscription storage; an email address and message go to the email service when an email is sent. Nothing else is sent.</p></section>
      <section><H>Your choices</H><p>Use Export my data and Delete my account in Settings. If payments are connected, billing records also exist with the payment service; ask {who()} to remove them.</p></section>
      <section><H>Contact</H><p>{who()}{OWNER.country ? ', ' + OWNER.country : ''}.{OWNER.email ? ' ' + OWNER.email + '.' : ''}</p></section>
    </Page>
  )
}
`

export const CHECKLIST_TSX = String.raw`import { Check, Circle } from 'lucide-react'
import { Button, Card } from '../wyber-ui'
import { LIMIT_ENTITY, RECORD_NOUN } from '../plans'
import { list, type Store } from '../lib/db'
import { hasSample } from '../lib/logic'
import type { SaasState } from '../lib/saas'

/** The first-run checklist. Each step is ticked from what really happened (the workspace, a teammate, a record you wrote), not from a click. */
export default function Checklist({ state, store, go, onDismiss, onRemoveSample }: {
  state: SaasState; store: Store; go: (v: string) => void; onDismiss: () => void; onRemoveSample: () => void
}) {
  if (state.checklistDismissed) return null
  const steps = [
    { id: 'ws', label: 'Create your workspace', done: Boolean(state.workspace), action: null as null | (() => void), cta: '' },
    { id: 'invite', label: 'Invite a teammate', done: state.members.some(m => m.role !== 'owner'), action: () => go('team'), cta: 'Open team' },
    { id: 'first', label: 'Add your first ' + RECORD_NOUN.one, done: list(store, LIMIT_ENTITY).some(r => !r.demo), action: () => go(LIMIT_ENTITY), cta: 'Add one' },
  ]
  const done = steps.filter(s => s.done).length
  const all = done === steps.length
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">{all ? 'You are set up' : 'Getting started'}</h2>
        <p className="text-sm text-muted-foreground">{done + ' of ' + steps.length + ' done'}</p>
      </div>
      {all ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">What you see below is your own data now.{hasSample(store) ? ' The rows marked Demo are still here; remove them when you are ready.' : ''}</p>
          <div className="flex flex-wrap gap-3">
            {hasSample(store) ? <Button variant="outline" size="sm" onClick={onRemoveSample}>Remove sample data</Button> : null}
            <Button size="sm" onClick={onDismiss}>Hide this checklist</Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {steps.map(s => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-3 text-sm text-foreground">
                {s.done ? <Check size={18} className="text-primary" aria-hidden="true" /> : <Circle size={18} className="text-muted-foreground" aria-hidden="true" />}
                <span className={s.done ? 'text-muted-foreground line-through' : ''}>{s.label}</span>
              </span>
              {!s.done && s.action ? <Button size="sm" variant="outline" onClick={s.action}>{s.cta}</Button> : null}
            </li>
          ))}
        </ul>
      )}
      {!all ? <div><button type="button" className="min-h-10 text-xs text-muted-foreground underline underline-offset-4 md:min-h-0" onClick={onDismiss}>Hide this checklist</button></div> : null}
    </Card>
  )
}
`
