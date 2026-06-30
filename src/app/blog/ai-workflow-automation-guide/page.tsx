import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'AI workflow automation without code',
  description: 'Connect your apps, apply AI reasoning, and run automations on a schedule — all from plain English. No Zapier, no Make, no code.',
  alternates: { canonical: 'https://wyberai.com/blog/ai-workflow-automation-guide' },
  openGraph: { title: 'AI workflow automation without code', url: 'https://wyberai.com/blog/ai-workflow-automation-guide', type: 'article' },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', amber: '#f59e0b' }

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
      </nav>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>← Back to blog</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.amber + '15', border: `1px solid ${s.amber}30`, fontSize: 11, fontWeight: 700, color: s.amber }}>Workflows</span>
          <span style={{ fontSize: 12, color: s.dim }}>June 12, 2026 · 5 min read</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          AI workflow automation without code — connect your apps and let them run
        </h1>

        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>Zapier and Make have been the standard for workflow automation for years. They work — but they require you to build each automation step by step, tool by tool, inside their own interfaces. And neither has real AI reasoning built in: adding an AI step means patching in an OpenAI connector as an afterthought.</p>

          <p>WyberAi's workflow builder works differently. You describe the automation in plain English. It generates the full canvas — trigger, tool connections, AI reasoning nodes, and action steps — and then runs it.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The difference that matters: AI is first-class</h2>
          <p>In Zapier, AI is a special module you bolt on. In WyberAi, every workflow can include a <strong style={{ color: s.text }}>Claude reasoning node</strong> anywhere in the flow — classify this input, score this record, summarize this email, decide which branch to take. The AI step is a native node type, not an integration.</p>

          <p>That means you can build automations that aren't purely deterministic. "If the email sounds urgent, route it to Slack. If it's a sales inquiry, add to HubSpot and draft a response." That branching logic requires judgment — and that's what the AI node provides.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>How to build a workflow</h2>
          <p>Open WyberAi, click <strong style={{ color: s.text }}>Workflows</strong>, and describe your automation in one sentence:</p>

          <div style={{ background: s.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '16px 0' }}>
            When a new row is added to my Airtable "Job Applications" base: score the applicant 1-10 for role fit using AI, add them to HubSpot as a contact tagged with the score, and send a Slack message to #hiring with their name, role, and score.
          </div>

          <p>The builder generates a canvas with four nodes: Airtable Trigger → Claude Scoring → HubSpot Create Contact → Slack Message. Connect your tools in Settings → Integrations (once, for all workflows), activate, and it runs automatically for every new Airtable row from that point on.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Triggers</h2>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Schedule — every day at 9 AM, every Monday at 8 AM, every hour',
              'Webhook — when a Typeform submission arrives, when a Stripe event fires',
              'App event — new Airtable row, new Gmail email, new HubSpot deal',
              'Manual — run once for testing',
            ].map(t => <li key={t}>{t}</li>)}
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>250+ integrations, no API key management</h2>
          <p>WyberAi uses Composio for integrations. You authenticate each app once — Gmail, Slack, HubSpot, Airtable, Notion, GitHub, Linear, Stripe, Google Sheets, and 240 more — and every workflow can use any of them without you managing API keys per tool.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Import from n8n</h2>
          <p>If you've already built workflows in n8n, you can import them directly. Export your n8n workflow as a JSON file (File → Download in n8n), then drag it into WyberAi's workflow importer. WyberAi maps 85+ n8n node types and reconstructs the canvas automatically — tools, connections, and all.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Workflows vs agents — when to use which</h2>
          <p>The distinction is subtle. <strong style={{ color: s.text }}>Workflows</strong> are sequential: trigger → step 1 → step 2 → done. They're best when the path is mostly predictable and you just need AI for one classification or summarization step. <strong style={{ color: s.text }}>Agents</strong> are more open-ended: they can loop, retry, and make multi-step decisions. Use an agent when the task requires ongoing judgment rather than a fixed sequence of steps.</p>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.amber}10`, border: `1px solid ${s.amber}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>Build your first workflow — free</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Describe it in plain English. WyberAi generates the canvas and runs it automatically.</p>
            <Link href="/dashboard?new=workflow" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.amber, color: '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Build my workflow →
            </Link>
          </div>
        </div>
      </article>

    </div>
  )
}
