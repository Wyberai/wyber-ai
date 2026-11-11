'use client'
import Link from 'next/link'
import { clearCtx, clearPending } from '@/lib/signal/handoff'

/**
 * The "Set up your client desk" button. Choosing this door is a fresh start: any plan the visitor sketched earlier on
 * another door (and the pending build that would start from it after sign-in) is forgotten, so signing in opens the
 * client desk instead of surprising them with a build they walked away from.
 */
export function AgencyStart({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return <Link className={className} href={href} onClick={() => { clearCtx(); clearPending() }}>{children}</Link>
}
