import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { localePath } from '@/lib/i18n/hreflang'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

const COLS: { heading: string; links: [string, string][] }[] = [
  { heading: 'Product', links: [['Pricing', '/pricing'], ['Replace your SaaS', '/byos'], ['Agencies', '/agencies'], ['Web Apps', '/use-cases/no-code-web-app-builder'], ['MCP Server', '/mcp'], ['Connectors', '/connectors'], ['Changelog', '/changelog'], ['Status', '/status']] },
  { heading: 'Resources', links: [['Learning Paths', '/learn'], ['Documentation', '/docs'], ['Use Cases', '/use-cases'], ['Blog', '/blog'], ['App ideas', '/build'], ['Free scan', '/tools'], ['Marketplace', '/marketplace']] },
  { heading: 'Compare', links: [['vs Lovable', '/vs/lovable'], ['vs Bolt', '/vs/bolt'], ['vs v0', '/vs/v0'], ['vs Replit', '/vs/replit'], ['vs Cursor', '/vs/cursor'], ['Lovable alternatives', '/lovable-alternatives']] },
  { heading: 'Company', links: [['Founders', '/founders'], ['Press', '/press'], ['Affiliates', '/affiliates'], ['Community', '/community-programs'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
]

export function SignalFooter({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  return (
    <footer className="sg-footer">
      <div className="sg-wrap">
        <div className="sg-fcols">
          <div>
            <Link href={localePath('/', locale)} aria-label="WyberAi home" style={{ display: 'inline-flex', marginBottom: 14 }}><WyberLogo markSize={26} wordmarkSize={16} /></Link>
            <p>Turn plain English into full-stack apps. Build, preview, and deploy before lunch.</p>
            <p style={{ marginTop: 12 }}>A product by SignalPulse Technologies<br />Wyoming, USA · hello@wyberai.com</p>
            <p className="sg-soc">{[['X', 'https://twitter.com/wyberai'], ['GitHub', 'https://github.com/Wyberai'], ['Discord', 'https://discord.gg/A5KsFv2P']].map(([l, h]) => <a key={l} href={h} target="_blank" rel="noreferrer">{l}</a>)}</p>
          </div>
          {COLS.map(c => (
            <div key={c.heading}>
              <h4>{c.heading}</h4>
              {c.links.map(([l, h]) => <Link key={h} href={localePath(h, locale)}>{l}</Link>)}
            </div>
          ))}
        </div>
        <div className="sg-fbase">
          <span>© {new Date().getFullYear()} SignalPulse Technologies LLC. All rights reserved.</span>
          <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/cookies">Cookies</Link></span>
        </div>
      </div>
    </footer>
  )
}
