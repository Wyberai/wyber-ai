import { describe, it, expect } from 'vitest'
import { gradeSlop } from './slop-scan'

const filler = Array.from({ length: 80 }, (_, i) => `plain${i}`).join(' ')
const page = (body: string, style = '') => `<html><head><style>${style}</style></head><body><p>${filler}</p>${body}</body></html>`
const status = (r: ReturnType<typeof gradeSlop>, id: string) => r.checks.find(c => c.id === id)?.status

describe('gradeSlop', () => {
  it('passes a plain, specific page', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('<h1>Property and family law in Pune.</h1><p>We listen first and explain your options.</p>', 'body{font-family:"Newsreader",serif;background:#fbfcfd;color:#14213d}') })
    expect(r.score).toBeGreaterThanOrEqual(90)
    expect(r.checks.every(c => c.status !== 'fail')).toBe(true)
  })

  it('names the clichés it found and quotes them', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('<p>Revolutionize your workflow with our seamless, cutting-edge platform that will supercharge your team.</p>') })
    expect(status(r, 'cliche')).toBe('fail')
    expect(r.checks.find(c => c.id === 'cliche')?.found).toEqual(expect.arrayContaining(['revolutionize', 'seamless', 'cutting-edge']))
  })

  it('flags placeholder text and invented proof', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('<p>Lorem ipsum dolor. Trusted by over 10,000 customers. 99.9% uptime.</p>') })
    expect(status(r, 'placeholder')).toBe('fail')
    expect(status(r, 'proof')).toBe('warn')
  })

  it('flags the indigo gradient and the cream-with-orange pairing', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('', '.hero{background:linear-gradient(135deg,#6366f1,#8b5cf6)} body{background:#fdf6e3} .btn{background:#ea580c}') })
    expect(status(r, 'purple')).toBe('fail')
    expect(status(r, 'cream')).toBe('fail')
  })

  it('does not call indigo without a gradient a fail', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('', '.a{color:#6366f1}') })
    expect(status(r, 'purple')).toBe('warn')
  })

  it('counts emoji used as icons and exclamation marks', () => {
    const r = gradeSlop({ url: 'https://x.test', html: page('<p>🚀 Fast! ⚡ Easy! 🎯 Smart! 💡 Simple! 🔥 Hot! ✨ New! 🌟 Top! 🎉 Done!</p>') })
    expect(status(r, 'emoji')).toBe('fail')
    expect(status(r, 'bang')).toBe('fail')
  })

  it('refuses to judge an empty shell instead of scoring it', () => {
    const r = gradeSlop({ url: 'https://x.test', html: '<html><body><div id="root"></div></body></html>' })
    expect(r.checks).toHaveLength(0)
    expect(r.verdict).toMatch(/Not enough readable text/)
  })
})
