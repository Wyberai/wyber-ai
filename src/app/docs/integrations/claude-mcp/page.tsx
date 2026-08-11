import { DocsPage, DocSection, Steps, Step, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = {
  title: 'Claude & MCP — Docs',
  description: 'Connect WyberAi to Claude, Claude Code, or Cursor via our remote MCP server and build, iterate, and publish apps from your AI assistant.',
}

const codeStyle: React.CSSProperties = {
  display: 'block', padding: '12px 14px', borderRadius: 9, background: '#111118',
  border: '1px solid rgba(255,255,255,0.08)', fontSize: 12.5, color: '#0EA5E9',
  fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6,
}
const p: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }
const inlineCode: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }

const TOOLS = [
  { name: 'get_account', kind: 'Read-only', desc: 'Your remaining credits and plan.' },
  { name: 'list_projects', kind: 'Read-only', desc: 'List the projects in your workspace.' },
  { name: 'get_project', kind: 'Read-only', desc: 'Details of one project, including file count and published URL.' },
  { name: 'select_project_type', kind: 'Read-only', desc: 'Available project types (web app, mobile, website, SaaS).' },
  { name: 'get_palette_options', kind: 'Read-only', desc: 'Preview design directions for a build before running it.' },
  { name: 'get_build_cost', kind: 'Read-only', desc: 'Price a build before running it, with an upsell if credits are short.' },
  { name: 'list_files', kind: 'Read-only', desc: 'List the file paths in a project.' },
  { name: 'read_file', kind: 'Read-only', desc: 'Read the source of one file in a project.' },
  { name: 'get_message_status', kind: 'Read-only', desc: 'Poll a queued build: queued → processing → done | error.' },
  { name: 'get_project_knowledge', kind: 'Read-only', desc: 'Read a project’s persistent knowledge (brand, standards, patterns).' },
  { name: 'get_database_status', kind: 'Read-only', desc: 'Whether the project has a Supabase database connected.' },
  { name: 'list_versions', kind: 'Read-only', desc: 'List saved project versions.' },
  { name: 'list_snapshots', kind: 'Read-only', desc: 'List saved named checkpoints of a project.' },
  { name: 'search_domains', kind: 'Read-only', desc: 'Check availability and price for a custom domain.' },
  { name: 'export_code', kind: 'Read-only', desc: 'Get a ZIP download link for the project.' },
  { name: 'run_security_scan', kind: 'Read-only · security', desc: 'RLS attacker-view scan of the connected database — finds tables that leak data.' },
  { name: 'list_connectors', kind: 'Read-only', desc: 'Browse 250+ connectors (Gmail, Notion, Linear, Slack…) to wire in.' },
  { name: 'create_project', kind: 'Write', desc: 'Create a new project (react-vite, next, vue, or vanilla).' },
  { name: 'start_build', kind: 'Write · uses credits', desc: 'Queue a build or change. Runs asynchronously; can rewrite existing project files.' },
  { name: 'set_project_knowledge', kind: 'Write', desc: 'Set persistent knowledge the builder applies on every future build.' },
  { name: 'rename_project', kind: 'Write', desc: 'Rename a project.' },
  { name: 'duplicate_project', kind: 'Write', desc: 'Copy a project’s files into a new project.' },
  { name: 'restore_version', kind: 'Write', desc: 'Roll a project back to a saved version.' },
  { name: 'save_snapshot', kind: 'Write', desc: 'Save a named checkpoint of the current project state.' },
  { name: 'restore_snapshot', kind: 'Write · destructive', desc: 'Roll a project back to a saved checkpoint.' },
  { name: 'execute_sql', kind: 'Write · database', desc: 'Run SQL on the project’s connected Supabase (reads, writes, schema).' },
  { name: 'connect_supabase', kind: 'Write', desc: 'Connect your own Supabase project for real auth and data.' },
  { name: 'connect_wybercloud', kind: 'Write', desc: 'Connect WyberAi’s zero-setup hosted database.' },
  { name: 'delete_project', kind: 'Write · destructive', desc: 'Permanently delete a project. Cannot be undone.' },
  { name: 'publish_to_web', kind: 'Write · public', desc: 'Publish the project to a live public URL. Republishing replaces the live version.' },
  { name: 'buy_domain', kind: 'Write · public', desc: 'Buy and attach a custom domain (checkout link, payment required).' },
  { name: 'export_mobile_build', kind: 'Temporarily unavailable', desc: 'APK/IPA export — currently disabled while the build backend is reworked. No credits are charged if called.' },
  { name: 'push_to_github', kind: 'Write · public', desc: 'Push the project to a connected GitHub repo.' },
  { name: 'invite_collaborator', kind: 'Write', desc: 'Invite a teammate as an editor or viewer.' },
]

export default function Page() {
  return (
    <DocsPage
      section="Integrations"
      title="Connect WyberAi to Claude (MCP)"
      intro="WyberAi ships a remote MCP (Model Context Protocol) server. Connect it to Claude, Claude Code, Cursor, or any MCP client, and your assistant can create WyberAi projects, build and iterate on apps, and publish them to live URLs — using your account and your credits."
      requirements={[
        { label: 'A WyberAi account (free tier works — 50 credits included)' },
        { label: 'A WyberAi API key', note: 'created in Settings → API Keys' },
      ]}
    >
      <DocSection title="Server details">
        <p style={p}>
          Endpoint: <code style={inlineCode}>https://wyberai.com/api/mcp</code> · Transport: <strong>Streamable HTTP</strong> (stateless, no SSE session required) · Auth: your API key, sent as either an{' '}
          <code style={inlineCode}>x-api-key</code> header or <code style={inlineCode}>Authorization: Bearer</code> token. Keys look like <code style={inlineCode}>wyb_…</code> and are stored hashed — treat them like passwords and rotate them from Settings → API Keys anytime.
        </p>
      </DocSection>

      <DocSection title="Connect from Claude Code">
        <code style={codeStyle}>{`claude mcp add --transport http wyberai https://wyberai.com/api/mcp --header "x-api-key: wyb_YOUR_KEY"`}</code>
      </DocSection>

      <DocSection title="Connect from Claude.ai">
        <Steps>
          <Step n={1} title="Create an API key">
            <p style={p}>In WyberAi, open <strong>Settings → API Keys</strong> and create a key. Copy it — it is shown only once.</p>
          </Step>
          <Step n={2} title="Add a custom connector">
            <p style={p}>In Claude, go to <strong>Settings → Connectors → Add custom connector</strong>, enter <code style={inlineCode}>https://wyberai.com/api/mcp</code>, and supply your API key when asked for credentials.</p>
          </Step>
          <Step n={3} title="Build from chat">
            <p style={p}>Ask Claude to <em>"create a waitlist app on WyberAi and publish it"</em>. It will chain <code style={inlineCode}>create_project</code> → <code style={inlineCode}>start_build</code> → <code style={inlineCode}>get_message_status</code> → <code style={inlineCode}>publish_to_web</code>.</p>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Available tools">
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          {TOOLS.map((t, i) => (
            <div key={t.name} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: i < TOOLS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <code style={{ ...inlineCode, color: '#0EA5E9', flexShrink: 0 }}>{t.name}</code>
              <span style={{ fontSize: 11, color: t.kind === 'Read-only' ? '#10b981' : '#f59e0b', fontWeight: 700, flexShrink: 0 }}>{t.kind}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{t.desc}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Billing, limits & availability">
        <p style={p}>
          Builds queued via <code style={inlineCode}>start_build</code> consume credits from the connected WyberAi account at the same rates as building in the web editor (see{' '}
          <Link href="/docs/getting-started/how-credits-work" style={{ color: '#0EA5E9' }}>how credits work</Link>). Listing, reading, and status tools are free. Builds run asynchronously and typically finish in under two minutes. The service is available globally wherever WyberAi operates.
        </p>
      </DocSection>

      <DocSection title="Privacy & support">
        <p style={p}>
          The MCP server only accesses projects owned by the API key's account, and never reads your Claude conversation — it sees only the tool calls Claude makes. See our{' '}
          <Link href="/privacy" style={{ color: '#0EA5E9' }}>privacy policy</Link>. Questions or issues: <a href="mailto:hello@wyberai.com" style={{ color: '#0EA5E9' }}>hello@wyberai.com</a> or the in-app support chat.
        </p>
      </DocSection>

      <Note>Treat your API key like a password. Anyone holding it can build with your credits and publish under your account — revoke keys immediately from Settings → API Keys if one leaks.</Note>
    </DocsPage>
  )
}
