// Reference: Stripe's sign-in — extremely minimal, generous whitespace, no
// decorative background, one clear action, small confident wordmark.
import { useState } from 'react'
import { Card, Button, Input } from '../wyber-ui'

export default function AuthLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[22rem]">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-sm font-bold text-background">B</div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in to your account</h1>
        </div>

        <Card className="p-8">
          <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <a href="#forgot-password" className="text-sm text-primary hover:underline">Forgot?</a>
              </div>
              <Input type="password" placeholder="" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account? <a href="#signup" className="font-medium text-foreground hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}
