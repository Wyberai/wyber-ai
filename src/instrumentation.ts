import * as Sentry from '@sentry/nextjs'

// Runs once when a new Next.js server instance boots. We use the nodejs
// branch to validate environment configuration loudly at startup instead of
// letting a missing var surface as an opaque 500 deep inside a request, and
// both branches also load Sentry's server/edge config (its own dsn/enabled
// gate lives in those files, same pattern as the mobile app's Sentry.init).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { reportEnv } = await import('./lib/env')
    reportEnv()
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
