// Reference: Raycast's preferences window — a left icon-sidebar of setting
// categories (not top tabs), dense rows, monospace keyboard-shortcut chips,
// everything reachable without scrolling.
import { useState } from 'react'
import { User, Bell, CreditCard, Keyboard, SlidersHorizontal } from 'lucide-react'
import { Card, Button, Input, Switch, cn } from '../wyber-ui'

const CATEGORIES = [
  { id: 'general', icon: User, label: 'General' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
  { id: 'advanced', icon: SlidersHorizontal, label: 'Advanced' },
]

const SHORTCUTS = [
  { action: 'Open command palette', keys: ['⌘', 'K'] },
  { action: 'Quick search', keys: ['⌘', '/'] },
  { action: 'New item', keys: ['⌘', 'N'] },
  { action: 'Toggle sidebar', keys: ['⌘', '\\'] },
]

export default function Settings() {
  const [category, setCategory] = useState('general')
  const [notifs, setNotifs] = useState({ product: true, security: true, marketing: false })

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border bg-card/40 p-3">
        <div className="mb-2 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</div>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors',
              category === cat.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <cat.icon size={15} />
            {cat.label}
          </button>
        ))}
      </aside>

      <div className="flex-1 px-8 py-10">
        <div className="mx-auto max-w-xl">
          {category === 'general' && (
            <>
              <h1 className="mb-6 text-lg font-semibold text-foreground">General</h1>
              <Card>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</label>
                    <Input defaultValue="Jordan Lee" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                    <Input defaultValue="jordan@example.com" type="email" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Workspace name</label>
                    <Input defaultValue="Acme Inc" />
                  </div>
                </div>
                <Button className="mt-6" size="sm">Save changes</Button>
              </Card>
            </>
          )}

          {category === 'notifications' && (
            <>
              <h1 className="mb-6 text-lg font-semibold text-foreground">Notifications</h1>
              <Card className="p-0">
                <div className="divide-y divide-border">
                  {[
                    { key: 'product' as const, label: 'Product updates', hint: 'New features and improvements' },
                    { key: 'security' as const, label: 'Security alerts', hint: 'Sign-ins and account changes' },
                    { key: 'marketing' as const, label: 'Marketing emails', hint: 'Tips, offers, and news' },
                  ].map(row => (
                    <div key={row.key} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">{row.label}</div>
                        <div className="text-xs text-muted-foreground">{row.hint}</div>
                      </div>
                      <Switch checked={notifs[row.key]} onChange={next => setNotifs(p => ({ ...p, [row.key]: next }))} />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {category === 'shortcuts' && (
            <>
              <h1 className="mb-6 text-lg font-semibold text-foreground">Keyboard shortcuts</h1>
              <Card className="p-0">
                <div className="divide-y divide-border">
                  {SHORTCUTS.map(s => (
                    <div key={s.action} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm text-foreground">{s.action}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map(k => (
                          <kbd key={k} className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{k}</kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {category === 'billing' && (
            <>
              <h1 className="mb-6 text-lg font-semibold text-foreground">Billing</h1>
              <Card>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Pro plan</div>
                    <div className="text-xs text-muted-foreground">$29/month · renews on the 1st</div>
                  </div>
                  <Button variant="outline" size="sm">Manage plan</Button>
                </div>
              </Card>
            </>
          )}

          {category === 'advanced' && (
            <>
              <h1 className="mb-6 text-lg font-semibold text-foreground">Advanced</h1>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Delete workspace</div>
                    <div className="text-xs text-muted-foreground">Permanently remove this workspace and all its data.</div>
                  </div>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
