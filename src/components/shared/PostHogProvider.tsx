'use client'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // PostHog analytics - loads only if key is configured
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          capture_pageview: false,
        })
      }
    }).catch(() => {})
  }, [])

  return <>{children}</>
}
