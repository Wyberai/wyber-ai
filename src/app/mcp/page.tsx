import { NavbarClient as Navbar } from '@/components/shared/NavbarClient'
import { Footer } from '@/components/shared/FooterClient'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WyberAi MCP Server — build & ship apps from Claude, Cursor & Claude Code',
  description: 'WyberAi ships a real remote MCP server with 34 tools. Create projects, run builds, inspect files, run SQL, scan for security holes, and publish live apps — without leaving your AI editor.',
}

const GROUPS: { label: string; accent?: boolean; tools: [string, string][] }[] = [
  { label: 'Build', tools: [['create_project', 'Start a new app from a prompt'], ['select_project_type', 'Pick web, mobile, website, or SaaS'], ['get_palette_options', 'Preview design directions'], ['get_build_cost', 'Price a build before running it'], ['start_build', 'Kick off a build or change'], ['get_message_status', 'Track a running build'], ['publish_to_web', 'Ship it to a live URL']] },
  { label: 'Inspect', tools: [['list_projects', 'See your workspace'], ['get_project', 'Project details'], ['list_files', 'The app file tree'], ['read_file', 'Read any source file'], ['get_account', 'Credits & plan']] },
  { label: 'Database', tools: [['execute_sql', 'Run SQL on the connected DB'], ['get_database_status', 'Is Supabase connected?'], ['connect_supabase', 'Connect your own Postgres'], ['connect_wybercloud', 'Zero-setup hosted DB']] },
  { label: 'Security', accent: true, tools: [['run_security_scan', 'Attacker-view RLS scan of the live DB']] },
  { label: 'Manage', tools: [['rename_project', 'Rename'], ['duplicate_project', 'Copy'], ['delete_project', 'Delete'], ['list_versions', 'Version history'], ['restore_version', 'Roll back a bad build'], ['save_snapshot', 'Save a named checkpoint'], ['list_snapshots', 'List saved checkpoints'], ['restore_snapshot', 'Roll back to a checkpoint']] },
  { label: 'Ship & collaborate', tools: [['search_domains', 'Check custom domain pricing'], ['buy_domain', 'Buy and attach a domain'], ['export_code', 'Download the project as a ZIP'], ['export_mobile_build', 'Export an APK/IPA — temporarily unavailable'], ['push_to_github', 'Push to a GitHub repo'], ['invite_collaborator', 'Add an editor or viewer']] },
  { label: 'Knowledge & Connectors', tools: [['get_project_knowledge', 'Read project standards'], ['set_project_knowledge', 'Set brand standards'], ['list_connectors', 'Browse 250+ connectors']] },
]

const FAQ: [string, string][] = [
  ['What is MCP?', 'The Model Context Protocol is an open standard that lets AI clients like Claude call external tools. WyberAi runs a remote MCP server, so any MCP-capable assistant can operate your WyberAi workspace directly.'],
  ['Which clients can I use?', 'Anything that speaks MCP over Streamable HTTP: Claude.ai, Claude Code, Cursor, and more. Add it as a custom connector with your API key.'],
  ['Is it included in my plan?', 'Yes. The MCP server is available on every plan, including the free tier (50 credits). Reads are free; builds spend credits at the same rates as the web editor.'],
  ['Do I need OAuth or an API key?', 'Claude.ai connects via OAuth — just sign in when prompted, no key to copy. Claude Code and other MCP clients use a WyberAi API key (created in Settings > API Keys) sent as an x-api-key header. Both are scoped to your account and revocable anytime.'],
]

const s = {
  code: { display: 'block', padding: '14px 16px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--sky)', overflowX: 'auto' as const, whiteSpace: 'pre' as const },
}

export default function McpPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />

      {/* Hero */}
      <div className="wy-section" style={{ paddingBottom: 0 }}>
        <div className="wy-sec-tag">MCP Server</div>
        <h1 className="wy-h2">Build apps <em>from Claude chat</em></h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 580, lineHeight: 1.75, marginBottom: 20 }}>
          WyberAi ships a real remote MCP server with 34 tools to build, deploy, and manage apps all from Claude, Cursor, or Claude Code without leaving your editor.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          <Link href="/api-keys" className="wy-btn-primary">Get your MCP key</Link>
          <Link href="/docs/integrations/claude-mcp" className="wy-btn-ghost">Read the docs</Link>
        </div>
        <div style={{ maxWidth: 620, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>Add it to Claude Code in one line:</div>
          <code style={s.code}>claude mcp add --transport http wyberai https://wyberai.com/api/mcp --header "x-api-key: wyb_YOUR_KEY"</code>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
            Or in Claude.ai: Settings {'>'}  Connectors {'>'}  Add custom connector. Coming soon to the Claude connectors directory.
          </div>
        </div>
      </div>

      {/* Capability grid */}
      <div className="wy-section" style={{ paddingTop: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>34 tools, everything an agent needs</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
          {GROUPS.map(g => (
            <div key={g.label} className="wy-card" style={{ padding: 24, ...(g.accent ? { border: '1px solid var(--sky)', boxShadow: '0 0 32px var(--sky-glow, rgba(14,165,233,0.15))' } : {}) }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: g.accent ? 'var(--sky)' : 'var(--text)', marginBottom: 14, letterSpacing: '-0.01em' }}>{g.label}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {g.tools.map(([t, d]) => (
                  <li key={t} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--sky)' }}>{t}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Security edge callout */}
      <div className="wy-section" style={{ paddingTop: 8 }}>
        <div style={{ padding: 40, borderRadius: 20, background: 'linear-gradient(135deg, var(--sky3), var(--bg2))', border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 12 }}>The only app-builder MCP that audits what it built</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 640 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--sky)', fontSize: 14 }}>run_security_scan</span> probes your projects live database with the public anon key and reports every table that leaks data. Ship from your editor, then verify its actually safe.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="wy-section" style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>FAQ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
          {FAQ.map(([q, a]) => (
            <div key={q} className="wy-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div className="wy-section" style={{ paddingTop: 8 }}>
        <div style={{ padding: 48, borderRadius: 20, background: 'linear-gradient(135deg, var(--sky3), var(--bg2))', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 12 }}>Drive WyberAi from Claude</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>Create your API key and connect in under a minute. Free tier included.</p>
          <Link href="/api-keys" className="wy-btn-primary">Get your MCP key</Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
