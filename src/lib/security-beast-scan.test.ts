import { describe, it, expect } from 'vitest'
import { runSecurityBeastScan } from './security-beast-scan'

const find = (files: Record<string, string>, id: string) => runSecurityBeastScan(files).checks.find(c => c.id === id)

describe('security scan false positives', () => {
  it('does not call a JSON-LD block XSS', () => {
    const app = `export default function App(){ return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@type': 'Dentist' }) }} /></> }`
    expect(find({ 'src/App.tsx': app }, 'xss')?.status).toBe('pass')
  })
  it('still flags dangerouslySetInnerHTML with other content', () => {
    const app = `export default function App({html}){ return <div dangerouslySetInnerHTML={{ __html: html }} /> }`
    expect(find({ 'src/App.tsx': app }, 'xss')?.status).toBe('fail')
  })
  it('does not ask a Vite site for next.config', () => {
    const files = { 'package.json': '{"dependencies":{"vite":"5"}}', 'src/App.tsx': 'export default () => null' }
    expect(find(files, 'security-headers')?.status).toBe('pass')
  })
  it('still asks a Next site for security headers', () => {
    const files = { 'package.json': '{"dependencies":{"next":"16"}}', 'next.config.js': 'module.exports = {}' }
    expect(find(files, 'security-headers')?.status).toBe('warn')
  })
})
