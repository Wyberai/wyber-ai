import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'What are AI agents? A practical guide for non-technical founders',
  description: 'Agents watch data, make decisions, and take action automatically. Here\'s what they actually are, what they\'re good for, and how to build one without code.',
  alternates: { canonical: 'https://wyberai.com/blog/what-are-ai-agents-guide' },
  openGraph: {
    title: 'What are AI agents? A practical guide for non-technical founders',
    description: 'Agents watch data, make decisions, and take action automatically. Here\'s what they actually are, what they\'re good for, and how to build one without code.',
    url: 'https://wyberai.com/blog/what-are-ai-agents-guide',
    type: 'article',
  },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', green: '#10b981' }

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
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.green + '15', border: `1px solid ${s.green}30`, fontSize: 11, fontWeight: 700, color: s.green }}>AI Agents</span>
          <span style={{ fontSize: 12, color: s.dim }}>June 13, 2026 · 7 min read</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          What are AI agents? A practical guide for non-technical founders
        </h1>

        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>"AI agent" has become one of those terms that means everything and nothing. Vendors use it to describe anything from a simple chatbot to a fully autonomous system that takes action in the world on your behalf. Here's the plain-English version.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The simplest definition</h2>
          <p>An AI agent is a program that <strong style={{ color: s.text }}>observes</strong> something (an email inbox, a database, a schedule), <strong style={{ color: s.text }}>decides</strong> what to do using AI reasoning, and <strong style={{ color: s.text }}>takes action</strong> — all without you having to trigger it manually.</p>

          <p>That's it. The word "agent" just means it acts on your behalf, autonomously, on a recurring basis.</p>

          <p>Compare that to a chatbot, which waits for you to type something and responds once. An agent doesn't wait — it monitors, reasons, and acts on its own schedule.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>What agents are actually good for</h2>
          <p>The best use cases for agents share three characteristics: the trigger is well-defined (a new email, a new row, 8 AM every morning), the decision requires some intelligence (classify this, summarize that, score this lead), and the action is something you currently do manually and hate doing.</p>

          <p>Real examples from WyberAi users:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Every morning at 8 AM: check Gmail for investor emails, summarize each one with key asks, send a Slack DM',
              'When a new row appears in Airtable: score the lead 1-10 using AI, add to HubSpot, notify the sales channel',
              'Every Sunday: pull last week\'s GitHub activity, write a progress summary, post to Notion',
              'When a Stripe payment fails: look up the customer, draft a recovery email, create a task in Linear',
            ].map(ex => <li key={ex}>{ex}</li>)}
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The anatomy of an agent</h2>
          <p>Every agent has the same three parts:</p>

          {[
            { label: 'Trigger', desc: 'What kicks the agent off. A cron schedule ("every day at 9 AM"), a webhook ("when a new form submission arrives"), or a manual run for testing.' },
            { label: 'Reasoning', desc: 'The AI step. A Claude node that classifies, scores, summarizes, extracts, or decides. This is what separates an agent from a plain automation — it can handle ambiguous input.' },
            { label: 'Actions', desc: 'What happens next. Send a Slack message, create a HubSpot contact, add a row to Google Sheets, post a Linear ticket. WyberAi connects to 250+ apps via Composio.' },
          ].map(part => (
            <div key={part.label} style={{ background: s.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.green, marginBottom: 4 }}>{part.label}</div>
              <div style={{ fontSize: 14 }}>{part.desc}</div>
            </div>
          ))}

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>How to build one without code</h2>
          <p>In WyberAi's agent builder, you describe the agent in plain English — the trigger, what you want it to reason about, and what it should do with the result. The builder generates the visual canvas: each step appears as a node, connected by arrows.</p>

          <p>You connect your tools once in Settings → Integrations (Gmail, Slack, HubSpot, etc.), then activate. The agent runs automatically from that point on.</p>

          <div style={{ background: s.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '16px 0' }}>
            Build an agent that runs every morning at 8 AM, checks my Gmail for emails from investors or enterprise prospects, summarizes each with key action items, and sends a Slack DM to me with the summaries.
          </div>

          <p>That prompt generates a canvas with four nodes: Schedule Trigger → Gmail tool → Claude AI reasoning → Slack DM. Connect Gmail and Slack, activate, and you're done.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>When not to use an agent</h2>
          <p>Agents are overkill if the task is purely deterministic (no AI needed), if it only needs to run once, or if a simple Zapier-style automation would do. The AI reasoning step is what justifies the complexity — if you don't need judgment, you just need a workflow.</p>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.green}10`, border: `1px solid ${s.green}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>Build your first agent — free</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Describe what you want the agent to watch and do. WyberAi builds the canvas, picks the tools, and runs it for you.</p>
            <Link href="/dashboard?new=agent" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.green, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Build my agent →
            </Link>
          </div>
        </div>
      </article>

    </div>
  )
}
