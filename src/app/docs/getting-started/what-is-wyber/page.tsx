import { DocsPage, DocSection, ScreenshotPlaceholder } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'What is WyberAi? — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Getting Started"
      title="What is WyberAi?"
      intro="WyberAi is a plain-English product builder. Describe what you want to build and Wyber generates a working app — web, mobile, agent, or workflow — with no code required."
    >
      <DocSection title="The six pillars">
        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 16 }}>
          Wyber covers six distinct capabilities — all from one platform, one credit balance:
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Web Apps', '/docs/web-apps/generating', 'Full-stack React apps with a Supabase backend, one-click Vercel deploy.'],
            ['Mobile Apps', '/docs/mobile-apps/generating', 'Expo React Native apps with a live in-browser preview and export to your phone.'],
            ['AI Agents', '/docs/ai-agents/building-in-plain-english', 'Multi-step agents that connect to 250+ external tools via Composio OAuth.'],
            ['Workflows', '/docs/workflows/building', 'Visual flow automations with triggers, AI steps, and action nodes.'],
            ['AI Employees', '/employees', 'Hire from 100 roles — the equivalent of senior specialists who run on a schedule and report back.'],
            ['GTM Engine', '/gtm', 'ICP-driven lead discovery, multi-step outreach sequences, and a visual campaign canvas.'],
          ].map(([name, href, desc]) => (
            <li key={href as string} style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>
              <Link href={href as string} style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>{name}</Link>
              {' — '}{desc}
            </li>
          ))}
        </ul>

        <ScreenshotPlaceholder label="Dashboard overview — six pillars" />
      </DocSection>

      <DocSection title="How it works (in one sentence)">
        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7 }}>
          You type a prompt → Wyber calls Claude to generate code → the code is built and previewed in real time → you iterate with follow-up prompts → you publish or export when done.
        </p>
      </DocSection>

      <DocSection title="What Wyber is not">
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'A drag-and-drop no-code builder (Bubble, Webflow). Wyber generates real code you can export.',
            'A coding assistant (GitHub Copilot). Wyber builds complete running apps, not autocomplete.',
            'A templates library. Every output is generated fresh from your prompt.',
          ].map((item, i) => (
            <li key={i} style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.65 }}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/docs/getting-started/your-first-build" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          Next: Your first build →
        </Link>
      </div>
    </DocsPage>
  )
}
