import { useState } from 'react'
import { Lock, CreditCard } from 'lucide-react'
import { Card, Button, Input, DataRow, Reveal } from '../wyber-ui'

const ITEMS = [
  { label: 'Pro plan — monthly', value: '$29.00' },
  { label: 'Seats × 3', value: '$18.00' },
  { label: 'Discount (WELCOME10)', value: '-$4.70' },
]

export default function Checkout() {
  const [processing, setProcessing] = useState(false)

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
        <Reveal>
          <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground">Checkout</h1>

          <Card className="mb-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard size={16} className="text-primary" /> Payment details
            </div>
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); setProcessing(true) }}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cardholder name</label>
                <Input placeholder="Jordan Lee" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Card number</label>
                <Input placeholder="4242 4242 4242 4242" inputMode="numeric" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Expiry</label>
                  <Input placeholder="MM / YY" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CVC</label>
                  <Input placeholder="123" inputMode="numeric" />
                </div>
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={processing}>
                {processing ? 'Processing…' : 'Pay $42.30'}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock size={11} /> Payments are encrypted and securely processed
              </p>
            </form>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <div className="mb-4 text-sm font-semibold text-foreground">Order summary</div>
            <div className="mb-2">
              {ITEMS.map((item, i) => <DataRow key={i} {...item} />)}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold text-foreground">Total due today</span>
              <span className="font-display text-xl font-bold text-foreground">$42.30</span>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
