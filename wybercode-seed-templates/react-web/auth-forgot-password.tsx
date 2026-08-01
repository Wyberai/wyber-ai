// Reference: Stripe — same minimal family as auth-login, one field, one
// action, a clear confirmation state instead of a toast.
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card, Button, Input } from '../wyber-ui'

export default function AuthForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[22rem]">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-sm font-bold text-background">B</div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a link.</p>
        </div>

        <Card className="p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2 size={28} className="text-primary" />
              <div className="text-sm font-medium text-foreground">Check your inbox</div>
              <p className="text-sm text-muted-foreground">We sent a reset link to {email || 'your email'}.</p>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); setSent(true) }}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
              </div>
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
          )}
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <a href="#login" className="font-medium text-foreground hover:underline">Back to sign in</a>
        </p>
      </div>
    </div>
  )
}
