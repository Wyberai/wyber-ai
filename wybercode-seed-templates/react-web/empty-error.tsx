import { Inbox, RefreshCcw } from 'lucide-react'
import { Button, EmptyState } from '../wyber-ui'

// Generic empty/error surface — reused for both "nothing here yet" states
// (empty lists, no results) and recoverable error states (failed fetch, 404).
// The patch step should swap the icon/title/description/action for the
// specific case; the layout and behavior stay the same either way.
export default function EmptyError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <EmptyState
        icon={<Inbox size={22} />}
        title="Nothing here yet"
        description="Once you add your first item, it'll show up here."
        action={
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        }
        className="max-w-sm"
      />
    </div>
  )
}
