import { useState } from 'react'
import { Rocket, Users, Target, CheckCircle2 } from 'lucide-react'
import { Card, Button, Reveal, AuroraBackground } from '../wyber-ui'

const STEPS = [
  { icon: Rocket, title: 'What are you building?', description: 'Tell us a bit about your project so we can tailor your setup.' },
  { icon: Users, title: 'Who is it for?', description: 'Invite teammates now or skip and add them later — up to you.' },
  { icon: Target, title: 'What matters most?', description: 'Pick a primary goal so we can surface the right features first.' },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const Icon = STEPS[step].icon

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <AuroraBackground intensity={0.1} />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={
                'h-1.5 rounded-full transition-all duration-300 ' +
                (i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-muted')
              }
            />
          ))}
        </div>

        <Reveal key={step}>
          <Card className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isLast ? <CheckCircle2 size={22} /> : <Icon size={22} />}
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{STEPS[step].title}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{STEPS[step].description}</p>

            <div className="mt-8 flex items-center gap-3">
              {step > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>Back</Button>
              )}
              <Button
                className="flex-1"
                onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
              >
                {isLast ? 'Finish setup' : 'Continue'}
              </Button>
            </div>
          </Card>
        </Reveal>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length} · <button className="font-medium text-primary hover:underline">Skip for now</button>
        </p>
      </div>
    </div>
  )
}
