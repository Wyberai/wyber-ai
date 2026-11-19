'use client'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { AuthForm } from '@/components/signal/AuthForm'

export default function LoginPage() {
  return (
    <SignalFrame bare>
      <div className="sg-wrap"><AuthForm mode="login" /></div>
    </SignalFrame>
  )
}
