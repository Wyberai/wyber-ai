'use client'
import { useEffect } from 'react'
import type { Door } from '@/lib/door-events'
import { doorEventOnce } from '@/lib/door-track'

/** Counts one anonymous page view for a door. Renders nothing. */
export function DoorView({ door }: { door: Door }) {
  useEffect(() => { doorEventOnce(door, 'view') }, [door])
  return null
}
