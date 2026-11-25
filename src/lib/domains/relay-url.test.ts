import { describe, expect, it } from 'vitest'
import { getProvider, relayUrlAllowed } from './index'

describe('the relay address', () => {
  const prod = { VERCEL_ENV: 'production', NODE_ENV: 'production' }
  it('is always fine over https', () => {
    expect(relayUrlAllowed('https://relay.wyberai.com', prod)).toBe(true)
    expect(relayUrlAllowed('HTTPS://relay.wyberai.com', prod)).toBe(true)
  })
  it('refuses plain http on production, allows it elsewhere (a local or preview relay)', () => {
    expect(relayUrlAllowed('http://209.38.122.197:8787', prod)).toBe(false)
    expect(relayUrlAllowed('http://localhost:8787', { NODE_ENV: 'development' })).toBe(true)
    expect(relayUrlAllowed('ftp://x', { NODE_ENV: 'development' })).toBe(false)
  })
  it('getProvider switches domains off rather than sending customer details over http on production', () => {
    expect(getProvider({ ...prod, DOMAINS_RELAY_URL: 'http://1.2.3.4:8787', DOMAINS_RELAY_SECRET: 'x' })).toBeNull()
    expect(getProvider({ ...prod, DOMAINS_RELAY_URL: 'https://relay.example.com', DOMAINS_RELAY_SECRET: 'x' })).not.toBeNull()
  })
})
