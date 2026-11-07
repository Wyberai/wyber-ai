import { describe, it, expect } from 'vitest'
import {
  parseAttribution,
  encodeAttribution,
  decodeAttribution,
  attributionToProfileColumns,
} from './signup-attribution'

describe('parseAttribution', () => {
  it('prefers explicit utm params and keeps medium/campaign', () => {
    const a = parseAttribution({
      search: '?utm_source=LinkedIn&utm_medium=social&utm_campaign=leak-check',
      referrer: 'https://www.linkedin.com/feed/',
      pathname: '/',
    })
    expect(a).toEqual({
      source: 'linkedin',
      medium: 'social',
      campaign: 'leak-check',
      referrerHost: 'linkedin.com',
      landingPath: '/',
    })
  })

  it('labels ad click ids when there is no utm_source', () => {
    expect(parseAttribution({ search: '?fbclid=abc', referrer: null, pathname: '/gujaratexpo' })?.source).toBe('meta-ads')
    expect(parseAttribution({ search: '?gclid=abc', referrer: null, pathname: '/' })?.source).toBe('google-ads')
  })

  it('uses the external referrer host for untagged organic visits', () => {
    const a = parseAttribution({ search: '', referrer: 'https://www.google.com/search?q=x', pathname: '/build/todo-app' })
    expect(a?.source).toBe('google.com')
    expect(a?.landingPath).toBe('/build/todo-app')
  })

  it('records direct visits with no referrer', () => {
    expect(parseAttribution({ search: '', referrer: null, pathname: '/' })?.source).toBe('direct')
  })

  it('ignores untagged internal navigation so it never overwrites a first touch', () => {
    expect(parseAttribution({ search: '', referrer: 'https://wyberai.com/pricing', pathname: '/signup' })).toBeNull()
  })

  it('strips unsafe characters and caps lengths', () => {
    const a = parseAttribution({
      search: `?utm_source=${encodeURIComponent('<script>x</script>' + 'a'.repeat(200))}`,
      referrer: null,
      pathname: '/',
    })
    expect(a?.source).not.toMatch(/[<>]/)
    expect(a!.source.length).toBeLessThanOrEqual(64)
  })
})

describe('cookie round trip', () => {
  it('encodes and decodes the same attribution', () => {
    const a = { source: 'x', medium: 'social', campaign: null, referrerHost: 't.co', landingPath: '/' }
    expect(decodeAttribution(encodeAttribution(a))).toEqual(a)
  })

  it('rejects garbage and tampered cookies', () => {
    expect(decodeAttribution(null)).toBeNull()
    expect(decodeAttribution('not json')).toBeNull()
    expect(decodeAttribution(encodeURIComponent('{"medium":"x"}'))).toBeNull()
  })

  it('re-sanitises a hand-edited cookie', () => {
    const raw = encodeURIComponent(JSON.stringify({ source: "x'; drop table profiles;--", landingPath: 'javascript:1' }))
    const a = decodeAttribution(raw)
    expect(a?.source).not.toContain("'")
    expect(a?.source).not.toContain(';')
    expect(a?.landingPath).toBe('/')
  })
})

describe('attributionToProfileColumns', () => {
  it('maps to the signup_* columns', () => {
    const raw = encodeAttribution({ source: 'meta-ads', medium: null, campaign: 'expo', referrerHost: null, landingPath: '/gujaratexpo' })
    expect(attributionToProfileColumns(raw)).toEqual({
      signup_source: 'meta-ads',
      signup_medium: null,
      signup_campaign: 'expo',
      signup_referrer_host: null,
      signup_landing_path: '/gujaratexpo',
    })
  })

  it('returns null when there is no usable cookie', () => {
    expect(attributionToProfileColumns(undefined)).toBeNull()
    expect(attributionToProfileColumns('%7B%7D')).toBeNull()
  })
})
