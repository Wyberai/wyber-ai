'use client'
import Link from 'next/link'
import type { Step } from '@/lib/door-events'
import { doorEvent } from '@/lib/door-track'

/** A door on the homepage: a normal link that also counts, anonymously, which door was chosen. */
export function DoorLink({ href, step, className, children }: { href: string; step: Step; className?: string; children: React.ReactNode }) {
  const onClick = () => doorEvent('home', step)
  return href.startsWith('#')
    ? <a className={className} href={href} onClick={onClick}>{children}</a>
    : <Link className={className} href={href} onClick={onClick}>{children}</Link>
}
