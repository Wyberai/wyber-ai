import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Card, Button, Input, Textarea, StatBlock, Reveal } from '../wyber-ui'

export default function Profile() {
  const [bio, setBio] = useState('Building things on the internet. Coffee-powered.')

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <Reveal className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">This is how others will see you on the platform.</p>
        </Reveal>

        <Card className="mb-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">JL</div>
              <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                <Camera size={12} />
              </button>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Jordan Lee</div>
              <div className="text-xs text-muted-foreground">@jordanlee · Joined Mar 2026</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</label>
              <Input defaultValue="Jordan Lee" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
              <Input defaultValue="jordanlee" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bio</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
            </div>
          </div>
          <Button className="mt-6">Save profile</Button>
        </Card>

        <Card>
          <div className="grid grid-cols-3 divide-x divide-border">
            <StatBlock value={128} label="Posts" className="items-center px-2 text-center" />
            <StatBlock value={4820} label="Followers" className="items-center px-2 text-center" />
            <StatBlock value={312} label="Following" className="items-center px-2 text-center" />
          </div>
        </Card>
      </div>
    </div>
  )
}
