'use client'
import { useEffect, useState } from 'react'
import { buildCalSrc } from '@/lib/consult-attribution'

/**
 * The booking calendar. It passes the ad's tags (utm_source, utm_campaign, and so on, plus which page the visitor came
 * through) into the booking, so each booked call can be traced to the campaign that produced it. Cal.com records utm_*
 * on the booking itself and sends any metadata[...] value back to us in the booking webhook, where the full payload is
 * already stored. It reads only the address bar and sends nothing anywhere except the booking form the visitor fills in.
 */
export function CalEmbed({ base, title }: { base: string; title: string }) {
  const [src, setSrc] = useState(`${base}?embed=true&theme=dark`)
  useEffect(() => {
    try { setSrc(buildCalSrc(base, window.location.search, window.location.pathname)) } catch { /* keep the plain link */ }
  }, [base])
  return (
    <iframe
      src={src}
      loading="lazy"
      title={title}
      style={{ width: '100%', height: 680, border: 'none', display: 'block', background: '#0d141e' }}
    />
  )
}
