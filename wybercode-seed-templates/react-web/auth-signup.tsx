// Reference: Notion — warm, human, soft rounded surfaces, SSO front-and-
// center above the plain email form (most people never touch the form).
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Card, Button, Input } from '../wyber-ui'

export default function AuthSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">✨</div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your workspace for notes, docs, and everything in between.</p>
        </div>

        <Card className="rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-2.5">
            <Button variant="outline" className="w-full justify-center gap-2.5 rounded-xl">
              <span className="text-base">🔵</span> Continue with Google
            </Button>
            <Button variant="outline" className="w-full justify-center gap-2.5 rounded-xl">
              <span className="text-base"></span> Continue with Apple
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {showEmailForm ? (
            <form className="flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
              <Input placeholder="Full name" className="rounded-xl" value={name} onChange={e => setName(e.target.value)} autoFocus />
              <Input type="email" placeholder="you@example.com" className="rounded-xl" value={email} onChange={e => setEmail(e.target.value)} />
              <Button type="submit" className="mt-1 w-full rounded-xl">Create account</Button>
            </form>
          ) : (
            <button
              onClick={() => setShowEmailForm(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-transparent py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Mail size={16} /> Continue with email
            </button>
          )}

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <a href="#login" className="font-medium text-foreground hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
