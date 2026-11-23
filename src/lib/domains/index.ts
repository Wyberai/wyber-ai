import { RelayDomainsClient } from './relay-client'
import { FakeDomainsProvider, newFakeState, type FakeState } from './fake-provider'
import { ENV_NAMES } from './config'
import type { DomainsProvider } from './types'

let fakeSingleton: FakeDomainsProvider | null = null
export const sandboxState = (): FakeState => ((fakeSingleton ??= new FakeDomainsProvider(newFakeState())).state)

/** True when this process may use the in-memory fake: never on production. */
export const fakeAllowed = (env: Record<string, string | undefined> = process.env) => env.VERCEL_ENV !== 'production' && env.NODE_ENV !== 'production'

/** The provider for this environment, or null when domains are not configured (routes answer 503). */
export function getProvider(env: Record<string, string | undefined> = process.env): DomainsProvider | null {
  if (env[ENV_NAMES.provider] === 'fake') {
    if (!fakeAllowed(env)) return null
    return (fakeSingleton ??= new FakeDomainsProvider(newFakeState()))
  }
  const url = env[ENV_NAMES.relayUrl]
  const secret = env[ENV_NAMES.relaySecret]
  if (!url || !secret) return null
  const currency = env[ENV_NAMES.currency] === 'INR' ? 'INR' : 'USD'
  return new RelayDomainsClient({ url, secret, currency, env })
}

export const isSandbox = (p: DomainsProvider | null) => p?.name === 'fake'
export const inrPerUsd = (env: Record<string, string | undefined> = process.env) => Number(env[ENV_NAMES.inrPerUsd]) || undefined
