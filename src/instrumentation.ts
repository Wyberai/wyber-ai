// Runs once when a new Next.js server instance boots (Node runtime only).
// We use it to validate environment configuration loudly at startup instead of
// letting a missing var surface as an opaque 500 deep inside a request.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { reportEnv } = await import('./lib/env')
    reportEnv()
  }
}
